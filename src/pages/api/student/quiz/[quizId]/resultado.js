// src/pages/api/student/quiz/[quizId]/resultado.js
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

    // Buscar resultado do quiz
    const resultadoResult = await query(`
      SELECT 
        rq.*,
        q.titulo as quiz_titulo,
        q.pontuacao_minima,
        m.titulo as modulo_titulo
      FROM resultados_quiz rq
      JOIN quizzes q ON rq.quiz_id = q.id
      JOIN modulos m ON q.modulo_id = m.id
      JOIN matriculas mat ON rq.matricula_id = mat.id
      WHERE rq.quiz_id = $1 
        AND mat.estudante_id = $2
      ORDER BY rq.data_realizacao DESC
      LIMIT 1
    `, [quizId, user.id]);
    
    if (resultadoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Nenhum resultado encontrado para este quiz' 
      });
    }

    const resultado = resultadoResult.rows[0];

    // Buscar detalhes das respostas
    const detalhesResult = await query(`
      SELECT 
        p.enunciado,
        p.pontos,
        o.texto as resposta_escolhida,
        o.correta as acertou
      FROM resultados_quiz rq
      -- Nota: Você precisa de uma tabela "respostas_aluno" para armazenar as respostas individualmente
      -- Esta query é um exemplo
      WHERE rq.id = $1
    `, [resultado.id]);

    res.status(200).json({
      success: true,
      data: {
        resultado: {
          id: resultado.id,
          pontuacao: resultado.pontuacao,
          aprovado: resultado.aprovado,
          tentativas: resultado.tentativas,
          data_realizacao: resultado.data_realizacao,
          quiz_titulo: resultado.quiz_titulo,
          pontuacao_minima: resultado.pontuacao_minima,
          modulo_titulo: resultado.modulo_titulo
        },
        detalhes: detalhesResult.rows
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);