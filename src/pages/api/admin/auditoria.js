import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acesso não autorizado. Apenas administradores.' 
      });
    }

    switch (req.method) {
      case 'GET':
        try {
          const auditoriaResult = await query(`
            SELECT 
              a.*,
              u.nome as usuario_nome,
              u.email as usuario_email,
              u.role as usuario_tipo
            FROM auditoria_sistema a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.data_hora DESC
            LIMIT 1000
          `);
          
          res.status(200).json({
            success: true,
            data: auditoriaResult.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar auditoria:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;
        
      default:
        return res.status(405).json({ 
          success: false,
          message: 'Método não permitido',
          allowed: ['GET']
        });
    }
  } catch (error) {
    console.error('Erro na API de auditoria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);