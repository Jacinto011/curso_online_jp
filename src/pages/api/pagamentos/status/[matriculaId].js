import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    const { matriculaId } = req.query;

    if (!matriculaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da matrícula é obrigatório' 
      });
    }

    // Buscar matrícula e pagamento
    const result = await query(`
      SELECT 
        m.*, 
        p.status as status_pagamento, 
        p.comprovante_url,
        c.titulo as curso_titulo
      FROM matriculas m
      LEFT JOIN pagamentos p ON m.id = p.matricula_id
      LEFT JOIN cursos c ON m.curso_id = c.id
      WHERE m.id = $1
    `, [matriculaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Matrícula não encontrada' 
      });
    }

    const matricula = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        matricula: {
          id: matricula.id,
          status: matricula.status,
          status_pagamento: matricula.status_pagamento,
          comprovante_url: matricula.comprovante_url,
          data_matricula: matricula.data_matricula,
          curso_titulo: matricula.curso_titulo
        }
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);