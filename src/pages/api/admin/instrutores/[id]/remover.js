import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

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
    // Verificar se é instrutor
    const instrutorResult = await query(
      'SELECT id, role FROM usuarios WHERE id = $1',
      [id]
    );
    
    const instrutor = instrutorResult.rows[0];
    
    if (!instrutor || instrutor.role !== 'instructor') {
      return res.status(404).json({ 
        success: false,
        message: 'Instrutor não encontrado' 
      });
    }
    
    // Não permitir remover a si mesmo
    if (parseInt(id) === user.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Não é possível remover seu próprio papel' 
      });
    }
    
    // Alterar papel para estudante
    await query(
      'UPDATE usuarios SET role = $1 WHERE id = $2',
      ['student', id]
    );
    
    // Arquivar pedido de instrutor
    await query(`
      UPDATE pedidos_instrutor 
      SET status = 'rejeitado', data_avaliacao = CURRENT_TIMESTAMP, avaliador_id = $1
      WHERE usuario_id = $2 AND status = 'aprovado'
    `, [user.id, id]);
    
    res.status(200).json({ 
      success: true, 
      message: 'Instrutor removido com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro ao remover instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);