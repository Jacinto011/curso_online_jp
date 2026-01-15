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
          u.role,
          u.ativo,
          u.data_criacao,
          pi.data_avaliacao as data_aprovacao
        FROM usuarios u
        LEFT JOIN pedidos_instrutor pi ON u.id = pi.usuario_id AND pi.status = 'aprovado'
        WHERE u.id = $1 AND u.role = 'instructor'
      `, [id]);
      
      const instrutor = result.rows[0];
      
      if (!instrutor) {
        return res.status(404).json({ 
          success: false,
          message: 'Instrutor não encontrado' 
        });
      }
      
      res.status(200).json({
        success: true,
        instrutor
      });
      
    } catch (error) {
      console.error('Erro ao buscar instrutor:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);