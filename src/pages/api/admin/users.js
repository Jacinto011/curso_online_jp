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
    const { page = 1, limit = 20, role = '', search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir query dinâmica
    let whereConditions = [];
    let params = [];
    
    if (role) {
      whereConditions.push('role = $' + (params.length + 1));
      params.push(role);
    }
    
    if (search) {
      whereConditions.push('(nome LIKE $' + (params.length + 1) + ' OR email LIKE $' + (params.length + 2) + ')');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM usuarios ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Query para buscar usuários
    const usersQuery = `
      SELECT id, nome, email, role, data_criacao, ativo, telefone, bio 
      FROM usuarios 
      ${whereClause}
      ORDER BY data_criacao DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const usersResult = await query(usersQuery, [...params, parseInt(limit), offset]);
    
    res.status(200).json({
      success: true,
      data: {
        usuarios: usersResult.rows,
        total: total,
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);