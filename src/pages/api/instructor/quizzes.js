import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
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
              q.*,
              m.titulo as modulo_titulo,
              COUNT(DISTINCT p.id) as total_perguntas
            FROM quizzes q
            JOIN modulos m ON q.modulo_id = m.id
            LEFT JOIN perguntas p ON q.id = p.quiz_id
            WHERE m.curso_id = $1
            GROUP BY q.id, m.titulo
            ORDER BY m.ordem ASC, q.titulo ASC
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
             RETURNING *`,
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