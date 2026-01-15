import withCors from '../../../lib/cors';
import { authenticate } from '../../../lib/auth';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    const user = await authenticate(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    const result = await query(
      `SELECT id, nome, email, role, ativo, telefone, avatar_url, bio, data_criacao
       FROM usuarios 
       WHERE id = $1 AND ativo = true`,
      [user.id]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    return res.status(200).json({
      success: true,
      user: usuario
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);