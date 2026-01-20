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
          const { status, data_inicio, data_fim } = req.query;
          
          let whereClause = 'WHERE 1=1';
          const params = [];
          
          if (status) {
            params.push(status);
            whereClause += ` AND p.status = $${params.length}`;
          }
          
          if (data_inicio) {
            params.push(data_inicio);
            whereClause += ` AND p.data_pagamento >= $${params.length}`;
          }
          
          if (data_fim) {
            params.push(data_fim);
            whereClause += ` AND p.data_pagamento <= $${params.length}`;
          }
          
          const pagamentosResult = await query(`
            SELECT 
              p.*,
              m.codigo as metodo_pagamento_nome,
              u.nome as estudante_nome,
              u.email as estudante_email,
              c.titulo as curso_titulo,
              c.instrutor_id,
              instrutor.nome as instrutor_nome
            FROM pagamentos p
            LEFT JOIN metodos_pagamento m ON p.metodo_pagamento_id = m.id
            LEFT JOIN matriculas mat ON p.matricula_id = mat.id
            LEFT JOIN usuarios u ON mat.estudante_id = u.id
            LEFT JOIN cursos c ON mat.curso_id = c.id
            LEFT JOIN usuarios instrutor ON c.instrutor_id = instrutor.id
            ${whereClause}
            ORDER BY p.data_pagamento DESC
          `, params);
          
          res.status(200).json({
            success: true,
            data: pagamentosResult.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar pagamentos:', error);
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
    console.error('Erro na API de admin pagamentos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);