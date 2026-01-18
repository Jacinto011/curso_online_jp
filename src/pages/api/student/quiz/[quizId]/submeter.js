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

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['POST']
      });
    }

    const { matricula_id, respostas } = req.body;
    
    if (!matricula_id || !respostas || !Array.isArray(respostas)) {
      return res.status(400).json({ 
        success: false,
        message: 'Dados inválidos' 
      });
    }

    // Verificar se a matrícula pertence ao usuário
    const matriculaResult = await query(`
      SELECT id, curso_id, status FROM matriculas 
      WHERE id = $1 AND estudante_id = $2
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Buscar dados do quiz
    const quizResult = await query(`
      SELECT q.*, m.id as modulo_id, m.curso_id,
             (SELECT MAX(ordem) FROM modulos WHERE curso_id = m.curso_id) as ultima_ordem_modulo,
             m.ordem as ordem_modulo
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      WHERE q.id = $1
    `, [quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz não encontrado' 
      });
    }

    const quiz = quizResult.rows[0];
    const isLastQuizCourse = quiz.ordem_modulo === quiz.ultima_ordem_modulo;

    // Buscar respostas corretas para calcular pontuação
    const respostasCorretasResult = await query(`
      SELECT 
        p.id as pergunta_id,
        p.pontos,
        ARRAY_AGG(o.id) as opcoes_corretas
      FROM perguntas p
      JOIN opcoes_resposta o ON p.id = o.pergunta_id
      WHERE p.quiz_id = $1 AND o.correta = true
      GROUP BY p.id, p.pontos
    `, [quizId]);

    const corretores = {};
    respostasCorretasResult.rows.forEach(row => {
      corretores[row.pergunta_id] = {
        pontos: row.pontos || 1,
        opcoes_corretas: row.opcoes_corretas
      };
    });

    // Calcular pontuação
    let pontuacaoTotal = 0;
    let maxPontos = 0;
    let acertos = 0;
    let totalPerguntas = respostasCorretasResult.rows.length;

    for (const resposta of respostas) {
      const corretor = corretores[resposta.pergunta_id];
      
      if (corretor) {
        maxPontos += corretor.pontos;
        
        // Verificar se a opção escolhida está entre as corretas
        if (corretor.opcoes_corretas.includes(parseInt(resposta.opcao_id))) {
          pontuacaoTotal += corretor.pontos;
          acertos++;
        }
      }
    }

    // Calcular percentual
    const percentual = maxPontos > 0 ? Math.round((pontuacaoTotal / maxPontos) * 100) : 0;
    const aprovado = percentual >= quiz.pontuacao_minima;

    // Verificar resultado anterior para determinar tentativa
    const resultadoAnterior = await query(`
      SELECT tentativas FROM resultados_quiz 
      WHERE matricula_id = $1 AND quiz_id = $2
    `, [matricula_id, quizId]);

    const tentativasAtuais = resultadoAnterior.rows.length > 0 
      ? resultadoAnterior.rows[0].tentativas + 1 
      : 1;

    // Salvar/atualizar resultado
    await query(`
      INSERT INTO resultados_quiz (matricula_id, quiz_id, pontuacao, aprovado, tentativas)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (matricula_id, quiz_id) 
      DO UPDATE SET 
        pontuacao = EXCLUDED.pontuacao,
        aprovado = EXCLUDED.aprovado,
        tentativas = EXCLUDED.tentativas,
        data_realizacao = CURRENT_TIMESTAMP
    `, [matricula_id, quizId, percentual, aprovado, tentativasAtuais]);

    // Se aprovado, marcar progresso no módulo
    if (aprovado) {
      // Verificar se já existe progresso para este módulo
      const progressoExistente = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 AND modulo_id = $2 AND material_id IS NULL
      `, [matricula_id, quiz.modulo_id]);
      
      if (progressoExistente.rows.length === 0) {
        await query(`
          INSERT INTO progresso (matricula_id, modulo_id, concluido, data_conclusao)
          VALUES ($1, $2, true, CURRENT_TIMESTAMP)
        `, [matricula_id, quiz.modulo_id]);
      } else {
        await query(`
          UPDATE progresso SET concluido = true, data_conclusao = CURRENT_TIMESTAMP
          WHERE matricula_id = $1 AND modulo_id = $2 AND material_id IS NULL
        `, [matricula_id, quiz.modulo_id]);
      }

      // Se for o último quiz do curso, verificar se pode concluir curso
      if (isLastQuizCourse && aprovado) {
        const todosModulosConcluidos = await verificarConclusaoCurso(matricula_id, matricula.curso_id);
        const todosQuizzesAprovados = await verificarTodosQuizzesAprovados(matricula_id, matricula.curso_id);
        
        if (todosModulosConcluidos && todosQuizzesAprovados) {
          // Atualizar matrícula para concluída
          await query(`
            UPDATE matriculas 
            SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [matricula_id]);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        pontuacao: percentual,
        pontuacao_minima: quiz.pontuacao_minima,
        aprovado,
        acertos,
        total_perguntas: totalPerguntas,
        tentativas: tentativasAtuais,
        ultimo_quiz_curso: isLastQuizCourse,
        mensagem: aprovado 
          ? `🎉 Parabéns! Você foi aprovado com ${percentual}%` 
          : `❌ Você obteve ${percentual}%. Precisa de ${quiz.pontuacao_minima}% para aprovação.`
      }
    });
    
  } catch (error) {
    console.error('Erro ao submeter quiz:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function verificarConclusaoCurso(matriculaId, cursoId) {
  try {
    const result = await query(`
      WITH modulos_curso AS (
        SELECT COUNT(*) as total FROM modulos WHERE curso_id = $1
      ),
      modulos_concluidos AS (
        SELECT COUNT(DISTINCT modulo_id) as concluidos 
        FROM progresso 
        WHERE matricula_id = $2 
          AND concluido = true
          AND material_id IS NULL
      )
      SELECT 
        (SELECT total FROM modulos_curso) as total,
        (SELECT concluidos FROM modulos_concluidos) as concluidos
    `, [cursoId, matriculaId]);

    const { total, concluidos } = result.rows[0];
    return concluidos === total;
  } catch (error) {
    console.error('Erro ao verificar conclusão do curso:', error);
    return false;
  }
}

async function verificarTodosQuizzesAprovados(matriculaId, cursoId) {
  try {
    const result = await query(`
      WITH quizzes_curso AS (
        SELECT q.id 
        FROM quizzes q
        JOIN modulos m ON q.modulo_id = m.id
        WHERE m.curso_id = $1
      ),
      quizzes_aprovados AS (
        SELECT COUNT(DISTINCT rq.quiz_id) as aprovados
        FROM resultados_quiz rq
        JOIN quizzes_curso qc ON rq.quiz_id = qc.id
        WHERE rq.matricula_id = $2 AND rq.aprovado = true
      ),
      total_quizzes AS (
        SELECT COUNT(*) as total FROM quizzes_curso
      )
      SELECT 
        (SELECT total FROM total_quizzes) as total,
        (SELECT aprovados FROM quizzes_aprovados) as aprovados
    `, [cursoId, matriculaId]);

    const { total, aprovados } = result.rows[0];
    
    // Se não há quizzes, retorna true
    if (total === 0) return true;
    
    return total === aprovados;
  } catch (error) {
    console.error('Erro ao verificar quizzes aprovados:', error);
    return false;
  }
}

export default withCors(handler);