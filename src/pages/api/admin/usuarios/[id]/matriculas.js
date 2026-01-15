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
          m.id,
          m.status,
          m.data_matricula,
          c.id as curso_id,
          c.titulo as curso_titulo
        FROM matriculas m
        JOIN cursos c ON m.curso_id = c.id
        WHERE m.estudante_id = $1
        ORDER BY m.data_matricula DESC
      `, [id]);
      
      res.status(200).json({
        success: true,
        matriculas: result.rows
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