import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
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
          m.*,
          c.titulo as curso_titulo,
          u.nome as estudante_nome,
          u.email as estudante_email,
          p.status as status_pagamento,
          p.comprovante_url,
          p.valor,
          p.data_pagamento,
          p.id as pagamento_id
        FROM matriculas m
        JOIN cursos c ON m.curso_id = c.id
        JOIN usuarios u ON m.estudante_id = u.id
        LEFT JOIN pagamentos p ON p.matricula_id = m.id
        WHERE c.instrutor_id = $1
        ORDER BY m.data_matricula DESC
      `, [user.id]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
      
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de matrículas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);