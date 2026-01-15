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

    if (req.method !== 'PUT') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['PUT']
      });
    }

    try {
      const { role } = req.body;
      
      if (!['admin', 'instructor', 'student'].includes(role)) {
        return res.status(400).json({ 
          success: false,
          message: 'Papel inválido' 
        });
      }
      
      // Verificar se usuário existe
      const usuarioResult = await query(
        'SELECT id FROM usuarios WHERE id = $1',
        [id]
      );
      
      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Usuário não encontrado' 
        });
      }
      
      // Não permitir alterar seu próprio papel
      if (parseInt(id) === user.id) {
        return res.status(400).json({ 
          success: false,
          message: 'Não é possível alterar seu próprio papel' 
        });
      }
      
      await query(
        'UPDATE usuarios SET role = $1 WHERE id = $2',
        [role, id]
      );
      
      res.status(200).json({ 
        success: true, 
        message: `Papel do usuário alterado para ${role}` 
      });
      
    } catch (error) {
      console.error('Erro ao alterar papel do usuário:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de role:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);