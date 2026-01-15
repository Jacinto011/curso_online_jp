import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'admin') {
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
            SELECT id, nome, email, role, data_criacao, ativo, telefone, bio 
            FROM usuarios 
            WHERE id = $1
          `, [id]);
          
          const usuario = result.rows[0];
          
          if (!usuario) {
            return res.status(404).json({ 
              success: false,
              message: 'Usuário não encontrado' 
            });
          }
          
          res.status(200).json({
            success: true,
            usuario
          });
          
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'PUT':
        try {
          const { nome, email, telefone, bio, ativo } = req.body;
          
          // Verificar se usuário existe
          const usuarioExistenteResult = await query(
            'SELECT id FROM usuarios WHERE id = $1', 
            [id]
          );
          
          if (usuarioExistenteResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Usuário não encontrado' 
            });
          }
          
          await query(
            `UPDATE usuarios 
             SET nome = $1, email = $2, telefone = $3, bio = $4, ativo = $5
             WHERE id = $6`,
            [nome, email, telefone || null, bio || null, ativo, id]
          );
          
          res.status(200).json({ 
            success: true, 
            message: 'Usuário atualizado com sucesso' 
          });
          
        } catch (error) {
          console.error('Erro ao atualizar usuário:', error);
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
          allowed: ['GET', 'PUT']
        });
    }
  } catch (error) {
    console.error('Erro na API de usuário:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);