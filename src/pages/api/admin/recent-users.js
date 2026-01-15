import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ 
      success: false,
      message: 'Não autorizado' 
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    const result = await query(`
      SELECT id, nome, email, role, data_criacao 
      FROM usuarios 
      ORDER BY data_criacao DESC 
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      usuarios: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar usuários recentes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);