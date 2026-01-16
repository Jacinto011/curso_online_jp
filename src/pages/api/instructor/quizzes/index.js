// src/pages/api/instructor/quizzes/index.js
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

    switch (req.method) {
      case 'GET':
        try {
          const { curso_id } = req.query;
          
          if (!curso_id) {
            return res.status(400).json({ 
              success: false,
              message: 'ID do curso é obrigatório' 
            });
          }

          // Verificar se o curso pertence ao instrutor
          const cursoResult = await query(
            'SELECT id FROM cursos WHERE id = $1 AND instrutor_id = $2',
            [curso_id, user.id]
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
          `, [curso_id]);

          res.status(200).json({
            success: true,
            data: result.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar quizzes:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { titulo, descricao, modulo_id, pontuacao_minima, tempo_limite } = req.body;
          
          if (!titulo || !modulo_id) {
            return res.status(400).json({ 
              success: false,
              message: 'Título e ID do módulo são obrigatórios' 
            });
          }

          // Verificar se o módulo pertence a um curso do instrutor
          const moduloResult = await query(`
            SELECT m.id 
            FROM modulos m
            JOIN cursos c ON m.curso_id = c.id
            WHERE m.id = $1 AND c.instrutor_id = $2
          `, [modulo_id, user.id]);
          
          if (moduloResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Módulo não encontrado ou não autorizado' 
            });
          }

          const quizResult = await query(
            `INSERT INTO quizzes (titulo, descricao, modulo_id, pontuacao_minima, tempo_limite) 
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, titulo, descricao, modulo_id, pontuacao_minima, tempo_limite, data_criacao`,
            [
              titulo, 
              descricao || null, 
              modulo_id, 
              pontuacao_minima || 70, 
              tempo_limite || null
            ]
          );

          res.status(201).json({
            success: true,
            data: quizResult.rows[0],
            message: 'Quiz criado com sucesso'
          });
          
        } catch (error) {
          console.error('Erro ao criar quiz:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      default:
        return res.status(405).json({ 
          success: false,
          message: 'Método não permitido',
          allowed: ['GET', 'POST']
        });
    }
  } catch (error) {
    console.error('Erro na API de quizzes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);