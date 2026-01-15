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
      const { status = '' } = req.query;
      
      let whereClause = 'WHERE c.instrutor_id = $1';
      const params = [id];
      
      if (status) {
        whereClause += ' AND c.status = $2';
        params.push(status);
      }
      
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
          (SELECT COUNT(*) FROM modulos WHERE curso_id = c.id) as total_modulos,
          (SELECT COUNT(*) FROM matriculas WHERE curso_id = c.id) as total_matriculas
        FROM cursos c
        ${whereClause}
        ORDER BY c.data_criacao DESC
      `, params);
      
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
  } catch (error) {
    console.error('Erro na API de cursos do instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);