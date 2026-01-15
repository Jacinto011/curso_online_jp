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
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.ativo,
        u.data_criacao,
        pi.data_avaliacao as data_aprovacao,
        COUNT(c.id) as total_cursos
      FROM usuarios u
      LEFT JOIN pedidos_instrutor pi ON u.id = pi.usuario_id AND pi.status = 'aprovado'
      LEFT JOIN cursos c ON u.id = c.instrutor_id
      WHERE u.role = 'instructor'
      GROUP BY u.id, u.nome, u.email, u.ativo, u.data_criacao, pi.data_avaliacao
      ORDER BY u.nome ASC
    `);
    
    res.status(200).json({
      success: true,
      instrutores: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar instrutores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);