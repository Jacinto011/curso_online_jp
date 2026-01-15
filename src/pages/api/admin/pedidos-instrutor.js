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
    const { status = 'pendente' } = req.query;
    
    const result = await query(`
      SELECT 
        pi.id,
        pi.usuario_id,
        pi.mensagem,
        pi.status,
        pi.data_pedido,
        u.nome,
        u.email,
        u.role
      FROM pedidos_instrutor pi
      JOIN usuarios u ON pi.usuario_id = u.id
      WHERE pi.status = $1
      ORDER BY pi.data_pedido ASC
    `, [status]);
    
    res.status(200).json({
      success: true,
      pedidos: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);