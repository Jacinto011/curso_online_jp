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
            SELECT mat.* 
            FROM materiais mat
            JOIN modulos m ON mat.modulo_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE mat.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Material não encontrado' 
            });
          }
          
          res.status(200).json({
            success: true,
            data: result.rows[0]
          });
          
        } catch (error) {
          console.error('Erro ao buscar material:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'PUT':
        try {
          const { titulo, tipo, url, conteudo, duracao, ordem } = req.body;
          
          // Verificar se o material pertence ao instrutor
          const materialResult = await query(`
            SELECT mat.id 
            FROM materiais mat
            JOIN modulos m ON mat.modulo_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE mat.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (materialResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Material não encontrado' 
            });
          }

          await query(
            `UPDATE materiais 
             SET titulo = $1, tipo = $2, url = $3, conteudo = $4, duracao = $5, ordem = $6
             WHERE id = $7`,
            [
              titulo, 
              tipo, 
              url || null, 
              conteudo || null, 
              duracao || null, 
              ordem || 1, 
              id
            ]
          );

          res.status(200).json({ 
            success: true, 
            message: 'Material atualizado com sucesso' 
          });
          
        } catch (error) {
          console.error('Erro ao atualizar material:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'DELETE':
        try {
          // Verificar se o material pertence ao instrutor
          const materialResult = await query(`
            SELECT mat.id 
            FROM materiais mat
            JOIN modulos m ON mat.modulo_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE mat.id = $1 AND c.instrutor_id = $2
          `, [id, user.id]);
          
          if (materialResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Material não encontrado' 
            });
          }

          await query('DELETE FROM materiais WHERE id = $1', [id]);

          res.status(200).json({ 
            success: true, 
            message: 'Material excluído com sucesso' 
          });
          
        } catch (error) {
          console.error('Erro ao excluir material:', error);
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
    console.error('Erro na API de material:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);