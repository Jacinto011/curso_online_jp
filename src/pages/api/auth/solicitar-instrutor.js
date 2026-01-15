import withCors from '../../../lib/cors';
import { authenticate } from '../../../lib/auth';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['POST']
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

    const { mensagem } = req.body;

    if (user.role === 'instructor' || user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Você já é um instrutor' 
      });
    }

    const pedidoPendente = await query(
      'SELECT id FROM pedidos_instrutor WHERE usuario_id = $1 AND status = $2',
      [user.id, 'pendente']
    );

    if (pedidoPendente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Você já tem um pedido pendente de instrutor' 
      });
    }

    await query(
      'INSERT INTO pedidos_instrutor (usuario_id, mensagem) VALUES ($1, $2)',
      [user.id, mensagem || null]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Solicitação enviada com sucesso! Aguarde a aprovação do administrador.' 
    });

  } catch (error) {
    console.error('Erro ao solicitar papel de instrutor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

export default withCors(handler);