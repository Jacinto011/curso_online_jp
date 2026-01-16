// src/pages/api/student/quiz/[quizId]/iniciar.js
import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
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

    // Buscar matrícula ativa do estudante no curso deste quiz
    const matriculaResult = await query(`
      SELECT m.id as matricula_id, m.curso_id, m.estudante_id
      FROM matriculas m
      JOIN quizzes q ON q.id = $1
      JOIN modulos mod ON q.modulo_id = mod.id
      WHERE m.estudante_id = $2 
        AND m.curso_id = mod.curso_id
        AND m.status IN ('ativa', 'concluida')
      LIMIT 1
    `, [quizId, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não está matriculado no curso deste quiz' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Buscar dados do quiz
    const quizResult = await query(`
      SELECT 
        q.*,
        m.titulo as modulo_titulo,
        m.ordem as modulo_ordem,
        c.titulo as curso_titulo,
        c.id as curso_id,
        -- Verificar se já realizou e foi aprovado
        EXISTS (
          SELECT 1 FROM resultados_quiz rq
          WHERE rq.matricula_id = $1 
            AND rq.quiz_id = q.id 
            AND rq.aprovado = true
        ) as ja_aprovado,
        -- Verificar se todos os materiais do módulo foram concluídos
        (
          SELECT COUNT(*) = (
            SELECT COUNT(*) FROM materiais WHERE modulo_id = m.id
          )
          FROM progresso p
          WHERE p.matricula_id = $2 
            AND p.modulo_id = m.id 
            AND p.material_id IS NOT NULL 
            AND p.concluido = true
        ) as materiais_concluidos
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      WHERE q.id = $3
    `, [matricula.matricula_id, matricula.matricula_id, quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz não encontrado' 
      });
    }

    const quiz = quizResult.rows[0];

    // Verificar se já foi aprovado
    if (quiz.ja_aprovado) {
      return res.status(400).json({ 
        success: false,
        message: 'Você já foi aprovado neste quiz' 
      });
    }

    // Verificar se todos os materiais foram concluídos (opcional, dependendo da regra)
    // Se quiser forçar a conclusão dos materiais antes do quiz, descomente:
    // if (!quiz.materiais_concluidos) {
    //   return res.status(403).json({ 
    //     success: false,
    //     message: 'Complete todos os materiais do módulo antes de realizar o quiz' 
    //   });
    // }

    // Buscar perguntas (sem as respostas corretas)
    const perguntasResult = await query(`
      SELECT 
        p.id,
        p.enunciado,
        p.tipo,
        p.pontos,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'texto', o.texto
            ) ORDER BY o.id
          ) FILTER (WHERE o.id IS NOT NULL),
          '[]'::json
        ) as opcoes
      FROM perguntas p
      LEFT JOIN opcoes_resposta o ON p.id = o.pergunta_id
      WHERE p.quiz_id = $1
      GROUP BY p.id
      ORDER BY p.id
    `, [quizId]);

    if (perguntasResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Este quiz ainda não possui perguntas' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          titulo: quiz.titulo,
          descricao: quiz.descricao,
          pontuacao_minima: quiz.pontuacao_minima,
          tempo_limite: quiz.tempo_limite,
          modulo_titulo: quiz.modulo_titulo,
          modulo_ordem: quiz.modulo_ordem,
          curso_titulo: quiz.curso_titulo,
          curso_id: quiz.curso_id,
          matricula_id: matricula.matricula_id,
          estudante_id: matricula.estudante_id
        },
        perguntas: perguntasResult.rows
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