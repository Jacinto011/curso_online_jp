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

    const result = await query(`
      SELECT 
        c.id,
        c.titulo,
        c.status,
        c.data_criacao,
        COUNT(DISTINCT m.id) as total_matriculas
      FROM cursos c
      LEFT JOIN matriculas m ON c.id = m.curso_id
      WHERE c.instrutor_id = $1
      GROUP BY c.id, c.titulo, c.status, c.data_criacao
      ORDER BY c.data_criacao DESC
    `, [id]);
    
    res.status(200).json({
      success: true,
      cursos: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar cursos do instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);