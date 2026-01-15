import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const cursosResult = await query(`
      SELECT 
        c.*,
        u.nome as instrutor_nome,
        u.avatar_url as instrutor_avatar,
        COUNT(DISTINCT m.id) as total_modulos,
        COUNT(DISTINCT mat.id) as total_matriculas,
        AVG(av.avaliacao) as media_avaliacoes
      FROM cursos c
      JOIN usuarios u ON c.instrutor_id = u.id
      LEFT JOIN modulos m ON c.id = m.curso_id
      LEFT JOIN matriculas mat ON c.id = mat.curso_id
      LEFT JOIN avaliacoes av ON c.id = av.curso_id
      WHERE c.status = 'publicado'
      GROUP BY c.id, u.id, u.nome, u.avatar_url
      ORDER BY 
        COUNT(DISTINCT mat.id) DESC,
        AVG(av.avaliacao) DESC NULLS LAST,
        c.data_criacao DESC
      LIMIT 8
    `);

    const cursosFormatados = cursosResult.rows.map(curso => ({
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      imagem_url: curso.imagem_url,
      categoria: curso.categoria,
      nivel: curso.nivel,
      instrutor_nome: curso.instrutor_nome,
      instrutor_avatar: curso.instrutor_avatar,
      preco: curso.preco,
      gratuito: curso.gratuito,
      duracao_estimada: curso.duracao_estimada,
      total_modulos: parseInt(curso.total_modulos) || 0,
      total_matriculas: parseInt(curso.total_matriculas) || 0,
      media_avaliacoes: parseFloat(curso.media_avaliacoes) || 0,
      status: curso.status,
      data_criacao: curso.data_criacao
    }));

    res.status(200).json({
      success: true,
      cursos: cursosFormatados
    });
    
  } catch (error) {
    console.error('Erro ao buscar cursos em destaque:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);