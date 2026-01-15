import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

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
            SELECT * FROM modulos 
            WHERE curso_id = $1 
            ORDER BY ordem ASC
          `, [curso_id]);

          res.status(200).json({
            success: true,
            data: result.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar módulos:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { titulo, descricao, curso_id, ordem } = req.body;
          
          if (!titulo || !curso_id) {
            return res.status(400).json({ 
              success: false,
              message: 'Título e ID do curso são obrigatórios' 
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

          const moduloResult = await query(
            `INSERT INTO modulos (titulo, descricao, curso_id, ordem) 
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [titulo, descricao || null, curso_id, ordem || 1]
          );

          res.status(201).json({
            success: true,
            data: moduloResult.rows[0],
            message: 'Módulo criado com sucesso'
          });
          
        } catch (error) {
          console.error('Erro ao criar módulo:', error);
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
    console.error('Erro na API de módulos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);