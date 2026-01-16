// src/pages/api/instructor/quizzes/[quizId]/index.js
import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { quizId } = req.query;
    
    if (!quizId || isNaN(parseInt(quizId))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do quiz inválido' 
      });
    }

    const quizIdNum = parseInt(quizId);

    if (req.method !== 'DELETE') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['DELETE']
      });
    }

    // Verificar se o quiz pertence ao instrutor
    const quizResult = await query(`
      SELECT q.id 
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      WHERE q.id = $1 AND c.instrutor_id = $2
    `, [quizIdNum, user.id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz não encontrado ou não autorizado' 
      });
    }

    // Iniciar transação para excluir quiz e dependências
    const client = await require('../../../../../lib/database-postgres').getPool().connect();
    
    try {
      await client.query('BEGIN');

      // Excluir opções das perguntas
      await client.query(`
        DELETE FROM opcoes_resposta 
        WHERE pergunta_id IN (
          SELECT id FROM perguntas WHERE quiz_id = $1
        )
      `, [quizIdNum]);

      // Excluir perguntas
      await client.query('DELETE FROM perguntas WHERE quiz_id = $1', [quizIdNum]);

      // Excluir resultados do quiz
      await client.query('DELETE FROM resultados_quiz WHERE quiz_id = $1', [quizIdNum]);

      // Excluir quiz
      await client.query('DELETE FROM quizzes WHERE id = $1', [quizIdNum]);

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Quiz excluído com sucesso'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erro ao excluir quiz:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);