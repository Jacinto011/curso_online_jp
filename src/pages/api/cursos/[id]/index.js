import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Buscar informações do curso
    const cursoResult = await query(`
      SELECT 
        c.*,
        u.nome as instrutor_nome,
        u.email as instrutor_email,
        u.bio as instrutor_bio,
        u.avatar_url as instrutor_avatar,
        COUNT(DISTINCT mat.id) as total_matriculas
      FROM cursos c
      JOIN usuarios u ON c.instrutor_id = u.id
      LEFT JOIN matriculas mat ON c.id = mat.curso_id AND mat.status IN ('ativa', 'concluida')
      WHERE c.id = $1 AND c.status = 'publicado'
      GROUP BY c.id, u.id
    `, [id]);
    
    if (cursoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Curso não encontrado ou não está publicado' 
      });
    }

    const curso = cursoResult.rows[0];

    // Buscar módulos do curso
    const modulosResult = await query(`
      SELECT 
        m.*,
        COUNT(DISTINCT mat.id) as total_materiais
      FROM modulos m
      LEFT JOIN materiais mat ON m.id = mat.modulo_id
      WHERE m.curso_id = $1
      GROUP BY m.id
      ORDER BY m.ordem ASC
    `, [id]);

    const modulos = modulosResult.rows;

    // Para cada módulo, buscar seus materiais
    for (let modulo of modulos) {
      const materiaisResult = await query(`
        SELECT 
          id,
          titulo,
          tipo,
          duracao,
          ordem,
          url,
          conteudo
        FROM materiais 
        WHERE modulo_id = $1
        ORDER BY ordem ASC
      `, [modulo.id]);
      
      modulo.materiais = materiaisResult.rows;
    }

    // Buscar quizzes do curso
    const quizzesResult = await query(`
      SELECT 
        q.*,
        m.ordem as modulo_ordem,
        m.titulo as modulo_titulo
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      WHERE m.curso_id = $1
    `, [id]);

    const quizzes = quizzesResult.rows;

    // Verificar se usuário está matriculado
    let matriculado = false;
    let progresso = null;
    
    try {
      const user = await authenticate(req);
      if (user) {
        const matriculaResult = await query(`
          SELECT id, status 
          FROM matriculas 
          WHERE estudante_id = $1 AND curso_id = $2
        `, [user.id, id]);
        
        matriculado = matriculaResult.rows.length > 0;
        
        if (matriculado) {
          const progressoResult = await query(`
            SELECT 
              COUNT(DISTINCT p.material_id) as aulas_concluidas,
              COUNT(DISTINCT m.id) as total_aulas
            FROM progresso p
            RIGHT JOIN materiais m ON p.material_id = m.id
            JOIN modulos md ON m.modulo_id = md.id
            WHERE md.curso_id = $1 AND p.matricula_id = $2 AND p.concluido = true
            GROUP BY md.curso_id
          `, [id, matriculaResult.rows[0].id]);
          
          if (progressoResult.rows.length > 0) {
            progresso = Math.round(
              (parseInt(progressoResult.rows[0].aulas_concluidas) / 
               parseInt(progressoResult.rows[0].total_aulas)) * 100
            );
          }
        }
      }
    } catch (authError) {
      // Usuário não autenticado, não faz nada
    }

    res.status(200).json({
      success: true,
      data: {
        curso,
        modulos,
        quizzes,
        requisitos: [
          'Computador com acesso à internet',
          'Conhecimentos básicos de informática',
          'Vontade de aprender'
        ],
        oque_vai_aprender: [
          'Domínio completo da tecnologia abordada',
          'Projetos práticos para o portfólio',
          'Suporte direto do instrutor',
          'Certificado de conclusão'
        ],
        usuario_matriculado: matriculado,
        progresso: progresso || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);