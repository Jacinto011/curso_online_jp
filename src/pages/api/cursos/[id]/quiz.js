import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    const { id: cursoId } = req.query;

    switch (req.method) {
      case 'GET':
        // Autenticação apenas para ver quizzes ativos
        const user = await authenticate(req);
        if (!user) {
          return res.status(401).json({ 
            success: false,
            message: 'Não autorizado' 
          });
        }

        try {
          // Buscar quizzes do curso (apenas ativos)
          const quizzesResult = await query(`
            SELECT 
              q.*,
              m.titulo as modulo_titulo,
              m.ordem as modulo_ordem
            FROM quizzes q
            JOIN modulos m ON q.modulo_id = m.id
            WHERE m.curso_id = $1
            ORDER BY m.ordem ASC, q.titulo ASC
          `, [cursoId]);

          res.status(200).json({
            success: true,
            data: quizzesResult.rows
          });
          
        } catch (error) {
          console.error('Erro ao buscar quizzes:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        // Submeter resposta de quiz
        const authUser = await authenticate(req);
        if (!authUser) {
          return res.status(401).json({ 
            success: false,
            message: 'Não autorizado' 
          });
        }

        try {
          const { quiz_id, respostas } = req.body;

          if (!quiz_id || !respostas) {
            return res.status(400).json({ 
              success: false,
              message: 'Quiz ID e respostas são obrigatórios' 
            });
          }

          // Buscar quiz
          const quizResult = await query(`
            SELECT * FROM quizzes 
            WHERE id = $1
          `, [quiz_id]);

          if (quizResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Quiz não encontrado' 
            });
          }

          const quiz = quizResult.rows[0];

          // Buscar perguntas do quiz
          const perguntasResult = await query(`
            SELECT id, pontos 
            FROM perguntas 
            WHERE quiz_id = $1
          `, [quiz_id]);

          const perguntas = perguntasResult.rows;
          
          // Buscar opções corretas para cada pergunta
          let pontuacaoTotal = 0;
          let pontosObtidos = 0;
          
          for (const pergunta of perguntas) {
            const opcoesResult = await query(`
              SELECT id, correta 
              FROM opcoes_resposta 
              WHERE pergunta_id = $1
            `, [pergunta.id]);
            
            const opcoes = opcoesResult.rows;
            pontuacaoTotal += pergunta.pontos;
            
            // Verificar respostas para esta pergunta
            if (respostas[pergunta.id]) {
              const respostaId = parseInt(respostas[pergunta.id]);
              const opcaoCorreta = opcoes.find(o => o.correta);
              
              if (opcaoCorreta && opcaoCorreta.id === respostaId) {
                pontosObtidos += pergunta.pontos;
              }
            }
          }

          const pontuacaoPercentual = pontuacaoTotal > 0 
            ? Math.round((pontosObtidos / pontuacaoTotal) * 100) 
            : 0;
          
          const aprovado = pontuacaoPercentual >= quiz.pontuacao_minima;

          // Verificar matrícula
          const matriculaResult = await query(`
            SELECT id 
            FROM matriculas 
            WHERE estudante_id = $1 AND curso_id = $2
          `, [authUser.id, cursoId]);
          
          if (matriculaResult.rows.length === 0) {
            return res.status(403).json({ 
              success: false,
              message: 'Você não está matriculado neste curso' 
            });
          }

          const matriculaId = matriculaResult.rows[0].id;

          // Registrar resultado do quiz
          await query(`
            INSERT INTO resultados_quiz 
            (matricula_id, quiz_id, pontuacao, aprovado, data_realizacao)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [matriculaId, quiz_id, pontuacaoPercentual, aprovado]);

          // Se aprovado, atualizar progresso
          if (aprovado) {
            await query(`
              INSERT INTO progresso 
              (matricula_id, modulo_id, concluido, data_conclusao)
              SELECT $1, q.modulo_id, true, CURRENT_TIMESTAMP
              FROM quizzes q
              WHERE q.id = $2
              ON CONFLICT (matricula_id, modulo_id) 
              DO UPDATE SET concluido = true, data_conclusao = CURRENT_TIMESTAMP
            `, [matriculaId, quiz_id]);
          }

          res.status(200).json({
            success: true,
            data: {
              pontuacao: pontuacaoPercentual,
              aprovado: aprovado,
              pontos_obtidos: pontosObtidos,
              pontos_total: pontuacaoTotal,
              mensagem: aprovado 
                ? 'Parabéns! Você foi aprovado no quiz.'
                : `Você acertou ${pontosObtidos} de ${pontuacaoTotal} pontos. Tente novamente.`,
              pode_repetir: true // Sempre pode repetir quizzes
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
        break;

      default:
        return res.status(405).json({ 
          success: false,
          message: 'Método não permitido',
          allowed: ['GET', 'POST']
        });
    }
  } catch (error) {
    console.error('Erro na API de quiz:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);