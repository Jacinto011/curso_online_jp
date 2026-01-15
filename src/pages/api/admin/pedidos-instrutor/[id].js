import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
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
    const { acao } = req.body; // 'aprovar' ou 'rejeitar'
    
    if (!['aprovar', 'rejeitar'].includes(acao)) {
      return res.status(400).json({ 
        success: false,
        message: 'Ação inválida' 
      });
    }
    
    // Buscar pedido
    const pedidoResult = await query(
      'SELECT * FROM pedidos_instrutor WHERE id = $1',
      [id]
    );
    
    const pedido = pedidoResult.rows[0];
    
    if (!pedido) {
      return res.status(404).json({ 
        success: false,
        message: 'Pedido não encontrado' 
      });
    }
    
    // Atualizar pedido
    await query(`
      UPDATE pedidos_instrutor 
      SET status = $1, data_avaliacao = CURRENT_TIMESTAMP, avaliador_id = $2
      WHERE id = $3
    `, [acao === 'aprovar' ? 'aprovado' : 'rejeitado', user.id, id]);
    
    // Se aprovado, atualizar papel do usuário
    if (acao === 'aprovar') {
      await query(
        'UPDATE usuarios SET role = $1 WHERE id = $2',
        ['instructor', pedido.usuario_id]
      );
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso` 
    });
    
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);