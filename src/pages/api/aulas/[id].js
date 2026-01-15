import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    // Buscar aula com informações do curso
    const aulaResult = await query(`
      SELECT 
        m.id as aula_id,
        m.titulo as aula_titulo,
        m.tipo,
        m.conteudo,
        m.url,
        m.duracao,
        m.ordem,
        md.id as modulo_id,
        md.titulo as modulo_titulo,
        c.id as curso_id,
        c.titulo as curso_titulo,
        c.instrutor_id
      FROM materiais m
      JOIN modulos md ON m.modulo_id = md.id
      JOIN cursos c ON md.curso_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (aulaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aula não encontrada' 
      });
    }
    
    const aula = aulaResult.rows[0];

    // Verificar se o usuário está matriculado
    const matriculaResult = await query(`
      SELECT id, status 
      FROM matriculas 
      WHERE estudante_id = $1 AND curso_id = $2
    `, [user.id, aula.curso_id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não está matriculado neste curso' 
      });
    }

    // Buscar aulas do módulo ordenadas
    const aulasResult = await query(`
      SELECT id, titulo, ordem
      FROM materiais 
      WHERE modulo_id = $1
      ORDER BY ordem ASC
    `, [aula.modulo_id]);
    
    const aulas = aulasResult.rows;
    const aulaIndex = aulas.findIndex(a => a.id === parseInt(id));
    
    // Buscar progresso do usuário
    const progressoResult = await query(`
      SELECT 
        p.concluido,
        p.data_conclusao
      FROM progresso p
      WHERE p.matricula_id = $1 AND p.material_id = $2
    `, [matriculaResult.rows[0].id, id]);
    
    const concluida = progressoResult.rows.length > 0 
      ? progressoResult.rows[0].concluido 
      : false;

    // Buscar aulas anterior e próxima
    const aulaAnterior = aulaIndex > 0 ? aulas[aulaIndex - 1] : null;
    const aulaProxima = aulaIndex < aulas.length - 1 ? aulas[aulaIndex + 1] : null;

    // Buscar total de aulas do curso
    const totalAulasResult = await query(`
      SELECT COUNT(*) as total
      FROM materiais m
      JOIN modulos md ON m.modulo_id = md.id
      WHERE md.curso_id = $1
    `, [aula.curso_id]);
    
    const totalAulas = parseInt(totalAulasResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        aula: {
          id: aula.aula_id,
          titulo: aula.aula_titulo,
          tipo: aula.tipo,
          conteudo: aula.conteudo,
          url: aula.url,
          duracao: aula.duracao,
          ordem: aula.ordem,
          modulo_titulo: aula.modulo_titulo,
          curso_titulo: aula.curso_titulo,
          curso_id: aula.curso_id
        },
        navegacao: {
          anterior: aulaAnterior ? {
            id: aulaAnterior.id,
            titulo: aulaAnterior.titulo
          } : null,
          proxima: aulaProxima ? {
            id: aulaProxima.id,
            titulo: aulaProxima.titulo
          } : null,
          totalAulas: aulas.length,
          posicaoAtual: aulaIndex + 1
        },
        progresso: {
          concluida: concluida,
          data_conclusao: progressoResult.rows.length > 0 
            ? progressoResult.rows[0].data_conclusao 
            : null
        },
        total_aulas_curso: totalAulas
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);