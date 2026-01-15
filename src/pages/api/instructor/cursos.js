import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    switch (req.method) {
      case 'GET':
        try {
          const result = await query(`
            SELECT 
              c.*,
              COUNT(DISTINCT m.id) as total_modulos,
              COUNT(DISTINCT mat.id) as total_matriculas
            FROM cursos c
            LEFT JOIN modulos m ON c.id = m.curso_id
            LEFT JOIN matriculas mat ON c.id = mat.curso_id
            WHERE c.instrutor_id = $1
            GROUP BY c.id
            ORDER BY c.data_criacao DESC
          `, [user.id]);
          
          res.status(200).json({
            success: true,
            data: result.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar cursos:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { titulo, descricao, preco, gratuito, duracao_estimada, 
                  imagem_url, categoria, nivel } = req.body;
          
          if (!titulo) {
            return res.status(400).json({ 
              success: false,
              message: 'Título é obrigatório' 
            });
          }
          
          const cursoResult = await query(
            `INSERT INTO cursos 
             (titulo, descricao, instrutor_id, preco, gratuito, duracao_estimada, imagem_url, categoria, nivel, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'rascunho')
             RETURNING *`,
            [
              titulo, 
              descricao || null, 
              user.id, 
              preco || 0, 
              gratuito || false, 
              duracao_estimada || null, 
              imagem_url || null, 
              categoria || null, 
              nivel || null
            ]
          );

          res.status(201).json({ 
            success: true, 
            message: 'Curso criado com sucesso',
            curso: cursoResult.rows[0]
          });
          
        } catch (error) {
          console.error('Erro ao criar curso:', error);
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
    console.error('Erro na API de cursos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);