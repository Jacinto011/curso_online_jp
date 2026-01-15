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
      SELECT id FROM matriculas 
      WHERE id = $1 AND estudante_id = $2
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    // Buscar quiz e perguntas
    const quizResult = await query(`
      SELECT q.*, q.pontuacao_minima, m.id as modulo_id
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

    // Verificar se já realizou este quiz
    const resultadoResult = await query(`
      SELECT id, aprovado FROM resultados_quiz 
      WHERE matricula_id = $1 AND quiz_id = $2
    `, [matricula_id, quizId]);
    
    if (resultadoResult.rows.length > 0 && resultadoResult.rows[0].aprovado) {
      return res.status(400).json({ 
        success: false,
        message: 'Você já foi aprovado neste quiz' 
      });
    }

    // Calcular pontuação
    let pontuacaoTotal = 0;
    let maxPontos = 0;
    
    for (const resposta of respostas) {
      const perguntaResult = await query(`
        SELECT p.*, o.correta
        FROM perguntas p
        JOIN opcoes_resposta o ON p.id = o.pergunta_id
        WHERE p.id = $1 AND o.id = $2
      `, [resposta.pergunta_id, resposta.opcao_id]);
      
      if (perguntaResult.rows.length > 0 && perguntaResult.rows[0].correta) {
        pontuacaoTotal += perguntaResult.rows[0].pontos || 1;
      }
      
      maxPontos += perguntaResult.rows[0]?.pontos || 1;
    }

    // Calcular percentual
    const percentual = maxPontos > 0 ? Math.round((pontuacaoTotal / maxPontos) * 100) : 0;
    const aprovado = percentual >= quiz.pontuacao_minima;

    // Salvar resultado com ON CONFLICT
    await query(`
      INSERT INTO resultados_quiz (matricula_id, quiz_id, pontuacao, aprovado, data_realizacao)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (matricula_id, quiz_id) 
      DO UPDATE SET 
        pontuacao = EXCLUDED.pontuacao, 
        aprovado = EXCLUDED.aprovado, 
        data_realizacao = EXCLUDED.data_realizacao
    `, [matricula_id, quizId, percentual, aprovado]);

    // Se aprovado, marcar módulo como concluído
    if (aprovado) {
      await query(`
        INSERT INTO progresso (matricula_id, modulo_id, concluido, data_conclusao)
        VALUES ($1, $2, true, CURRENT_TIMESTAMP)
        ON CONFLICT (matricula_id, modulo_id) 
        DO UPDATE SET concluido = EXCLUDED.concluido, data_conclusao = EXCLUDED.data_conclusao
      `, [matricula_id, quiz.modulo_id]);
    }

    res.status(200).json({
      success: true,
      data: {
        pontuacao: percentual,
        pontuacao_minima: quiz.pontuacao_minima,
        aprovado,
        max_pontos: maxPontos,
        mensagem: aprovado 
          ? 'Parabéns! Você foi aprovado no quiz e pode prosseguir para o próximo módulo.' 
          : `Você precisa de ${quiz.pontuacao_minima}% para aprovação. Tente novamente.`
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

export default withCors(handler);