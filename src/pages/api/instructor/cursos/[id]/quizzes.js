// src/pages/api/instructor/cursos/[cursoId]/quizzes.js
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

    const { cursoId } = req.query;

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Verificar se o curso pertence ao instrutor
    const cursoResult = await query(
      'SELECT id FROM cursos WHERE id = $1 AND instrutor_id = $2',
      [cursoId, user.id]
    );
    
    if (cursoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Curso não encontrado ou não autorizado' 
      });
    }

    const result = await query(`
      SELECT 
        q.id,
        q.titulo,
        q.descricao,
        q.modulo_id,
        q.pontuacao_minima,
        q.tempo_limite,
        q.data_criacao,
        m.titulo as modulo_titulo,
        m.ordem as modulo_ordem,
        COALESCE(pergunta_counts.total, 0) as total_perguntas
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      LEFT JOIN (
        SELECT quiz_id, COUNT(*) as total
        FROM perguntas
        GROUP BY quiz_id
      ) pergunta_counts ON q.id = pergunta_counts.quiz_id
      WHERE m.curso_id = $1
      ORDER BY m.ordem ASC, q.data_criacao DESC
    `, [cursoId]);

    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar quizzes do curso:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);