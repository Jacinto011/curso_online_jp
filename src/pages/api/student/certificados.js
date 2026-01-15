import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
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

    const result = await query(`
      SELECT 
        cert.*,
        c.titulo as curso_titulo,
        c.descricao as curso_descricao,
        u.nome as instrutor_nome,
        m.data_conclusao
      FROM certificados cert
      JOIN matriculas m ON cert.matricula_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON c.instrutor_id = u.id
      WHERE m.estudante_id = $1
      ORDER BY cert.data_emissao DESC
    `, [user.id]);

    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);