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
          const { modulo_id } = req.query;
          
          if (!modulo_id) {
            return res.status(400).json({ 
              success: false,
              message: 'ID do módulo é obrigatório' 
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

          const result = await query(`
            SELECT * FROM materiais 
            WHERE modulo_id = $1 
            ORDER BY ordem ASC
          `, [modulo_id]);

          res.status(200).json({
            success: true,
            data: result.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar materiais:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { titulo, tipo, url, conteudo, modulo_id, duracao, ordem } = req.body;
          
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

          const materialResult = await query(
            `INSERT INTO materiais (titulo, tipo, url, conteudo, modulo_id, duracao, ordem) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
              titulo, 
              tipo, 
              url || null, 
              conteudo || null, 
              modulo_id, 
              duracao || null, 
              ordem || 1
            ]
          );

          res.status(201).json({
            success: true,
            data: materialResult.rows[0],
            message: 'Material criado com sucesso'
          });
          
        } catch (error) {
          console.error('Erro ao criar material:', error);
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
    console.error('Erro na API de materiais:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);