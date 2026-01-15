import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
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
    const { status = '', search = '' } = req.query;
    
    // Construir query dinâmica
    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereConditions.push(`c.status = $${paramCount}`);
      params.push(status);
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`(c.titulo LIKE $${paramCount} OR c.descricao LIKE $${paramCount + 1} OR u.nome LIKE $${paramCount + 2})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const result = await query(`
      SELECT 
        c.id,
        c.titulo,
        c.descricao,
        c.preco,
        c.gratuito,
        c.status,
        c.data_criacao,
        c.imagem_url,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        (SELECT COUNT(*) FROM modulos WHERE curso_id = c.id) as total_modulos,
        (SELECT COUNT(*) FROM matriculas WHERE curso_id = c.id) as total_matriculas
      FROM cursos c
      JOIN usuarios u ON c.instrutor_id = u.id
      WHERE ${whereClause}
      ORDER BY c.data_criacao DESC
    `, params);
    
    res.status(200).json({
      success: true,
      cursos: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);