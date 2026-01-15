import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
      const { 
        status = 'publicado', 
        categoria = '', 
        nivel = '', 
        preco = '', 
        search = '',
        limit = 20,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Construir query dinâmica
      let whereConditions = ['c.status = $1'];
      let params = [status];
      
      if (categoria) {
        whereConditions.push('c.categoria LIKE $' + (params.length + 1));
        params.push(`%${categoria}%`);
      }
      
      if (nivel) {
        whereConditions.push('c.nivel = $' + (params.length + 1));
        params.push(nivel);
      }
      
      if (preco === 'gratuito') {
        whereConditions.push('c.gratuito = true');
      } else if (preco === 'pago') {
        whereConditions.push('c.gratuito = false');
      }
      
      if (search) {
        whereConditions.push('(c.titulo LIKE $' + (params.length + 1) + 
                           ' OR c.descricao LIKE $' + (params.length + 2) + 
                           ' OR u.nome LIKE $' + (params.length + 3) + ')');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total 
        FROM cursos c
        JOIN usuarios u ON c.instrutor_id = u.id
        WHERE ${whereClause}
      `;
      
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      
      // Query para buscar cursos
      const cursosQuery = `
        SELECT 
          c.*,
          u.nome as instrutor_nome,
          u.avatar_url as instrutor_avatar,
          COUNT(DISTINCT mat.id) as total_matriculas
        FROM cursos c
        JOIN usuarios u ON c.instrutor_id = u.id
        LEFT JOIN matriculas mat ON c.id = mat.curso_id AND mat.status IN ('ativa', 'concluida')
        WHERE ${whereClause}
        GROUP BY c.id, u.id
        ORDER BY c.data_criacao DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      const cursosResult = await query(cursosQuery, [...params, parseInt(limit), offset]);

      res.status(200).json({
        cursos: cursosResult.rows,
        total: total,
        pagina: parseInt(page),
        por_pagina: parseInt(limit),
        total_paginas: Math.ceil(total / limit)
      });
      
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('Erro na API de cursos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export default withCors(handler);