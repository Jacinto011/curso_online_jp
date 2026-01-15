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

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        try {
          const result = await query(`
            SELECT m.* 
            FROM modulos m
            JOIN cursos c ON m.curso_id = c.id
            WHERE m.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Módulo não encontrado' 
            });
          }
          
          res.status(200).json({
            success: true,
            data: result.rows[0]
          });
          
        } catch (error) {
          console.error('Erro ao buscar módulo:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'PUT':
        try {
          const { titulo, descricao, ordem } = req.body;
          
          // Verificar se o módulo pertence ao instrutor
          const moduloResult = await query(`
            SELECT m.id 
            FROM modulos m
            JOIN cursos c ON m.curso_id = c.id
            WHERE m.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (moduloResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Módulo não encontrado' 
            });
          }

          await query(
            `UPDATE modulos 
             SET titulo = $1, descricao = $2, ordem = $3
             WHERE id = $4`,
            [titulo, descricao || null, ordem || 1, id]
          );

          res.status(200).json({ 
            success: true, 
            message: 'Módulo atualizado com sucesso' 
          });
          
        } catch (error) {
          console.error('Erro ao atualizar módulo:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'DELETE':
        try {
          // Verificar se o módulo pertence ao instrutor
          const moduloResult = await query(`
            SELECT m.id 
            FROM modulos m
            JOIN cursos c ON m.curso_id = c.id
            WHERE m.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (moduloResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Módulo não encontrado' 
            });
          }

          // Usar transação para deletar em cascata
          const client = await require('../../../../lib/database-postgres').getPool().connect();
          
          try {
            await client.query('BEGIN');
            
            // Deletar materiais primeiro
            await client.query('DELETE FROM materiais WHERE modulo_id = $1', [id]);
            
            // Deletar módulo
            await client.query('DELETE FROM modulos WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            
            res.status(200).json({ 
              success: true, 
              message: 'Módulo excluído com sucesso' 
            });
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
          
        } catch (error) {
          console.error('Erro ao excluir módulo:', error);
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
          allowed: ['GET', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error('Erro na API de módulo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);