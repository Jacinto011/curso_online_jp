import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

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

    const { quizId } = req.query;

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Buscar quiz e verificar permissões
    const quizResult = await query(`
      SELECT 
        q.*,
        m.id as modulo_id,
        m.ordem as modulo_ordem,
        m.curso_id,
        c.titulo as curso_titulo,
        -- Verificar se está matriculado
        mat.id as matricula_id,
        -- Verificar se módulo anterior foi concluído
        (
          SELECT p.concluido 
          FROM progresso p
          JOIN modulos ant ON p.modulo_id = ant.id
          WHERE p.matricula_id = mat.id 
            AND ant.ordem = m.ordem - 1
          LIMIT 1
        ) as modulo_anterior_concluido,
        -- Verificar se já realizou este quiz
        r.aprovado as ja_realizado
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      LEFT JOIN matriculas mat ON c.id = mat.curso_id AND mat.estudante_id = $1
      LEFT JOIN resultados_quiz r ON q.id = r.quiz_id AND r.matricula_id = mat.id
      WHERE q.id = $2
    `, [user.id, quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz não encontrado' 
      });
    }

    const quiz = quizResult.rows[0];

    if (!quiz.matricula_id) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não está matriculado neste curso' 
      });
    }

    if (quiz.modulo_ordem > 1 && !quiz.modulo_anterior_concluido) {
      return res.status(403).json({ 
        success: false,
        message: 'Complete o módulo anterior antes de realizar este quiz' 
      });
    }

    if (quiz.ja_realizado) {
      return res.status(400).json({ 
        success: false,
        message: 'Você já realizou e foi aprovado neste quiz' 
      });
    }

    // Buscar perguntas e opções
    const perguntasResult = await query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', o.id,
            'texto', o.texto,
            'correta', o.correta
          )
        ) as opcoes
      FROM perguntas p
      LEFT JOIN opcoes_resposta o ON p.id = o.pergunta_id
      WHERE p.quiz_id = $1
      GROUP BY p.id
      ORDER BY p.id ASC
    `, [quizId]);

    // Parse das opções JSON
    const perguntasFormatadas = perguntasResult.rows.map(p => ({
      ...p,
      opcoes: p.opcoes || []
    }));

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          titulo: quiz.titulo,
          descricao: quiz.descricao,
          pontuacao_minima: quiz.pontuacao_minima,
          tempo_limite: quiz.tempo_limite,
          modulo_id: quiz.modulo_id,
          curso_titulo: quiz.curso_titulo
        },
        perguntas: perguntasFormatadas
      }
    });
    
  } catch (error) {
    console.error('Erro ao iniciar quiz:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);