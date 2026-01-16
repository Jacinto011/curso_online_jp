// src/pages/api/instructor/perguntas/[id].js
import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { id } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID da pergunta inválido' 
      });
    }

    const perguntaId = parseInt(id);

    if (req.method !== 'DELETE') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['DELETE']
      });
    }

    // Verificar se a pergunta pertence a um quiz do instrutor
    const perguntaResult = await query(`
      SELECT p.id 
      FROM perguntas p
      JOIN quizzes q ON p.quiz_id = q.id
      JOIN modulos m ON q.modulo_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      WHERE p.id = $1 AND c.instrutor_id = $2
    `, [perguntaId, user.id]);
    
    if (perguntaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Pergunta não encontrada ou não autorizada' 
      });
    }

    // Iniciar transação para excluir pergunta e suas opções
    const client = await require('../../../../lib/database-postgres').getPool().connect();
    
    try {
      await client.query('BEGIN');

      // Excluir opções primeiro (devido à chave estrangeira)
      await client.query(
        'DELETE FROM opcoes_resposta WHERE pergunta_id = $1',
        [perguntaId]
      );

      // Excluir pergunta
      await client.query(
        'DELETE FROM perguntas WHERE id = $1',
        [perguntaId]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Pergunta excluída com sucesso'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erro ao excluir pergunta:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);