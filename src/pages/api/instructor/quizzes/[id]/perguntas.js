// src/pages/api/instructor/quizzes/[quizId]/perguntas.js
import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

   // console.log(req.query);
    
    const  quizId  = req.query.id;
    
    if (!quizId || isNaN(parseInt(quizId))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do quiz inválido' 
      });
    }

    const quizIdNum = parseInt(quizId);

    switch (req.method) {
      case 'GET':
        try {
          console.log(`🔍 Buscando perguntas para quiz ID: ${quizIdNum}`);
          
          // Verificar se o quiz pertence ao instrutor
          const quizResult = await query(`
            SELECT q.id, q.titulo, q.modulo_id, m.titulo as modulo_titulo, c.id as curso_id
            FROM quizzes q
            JOIN modulos m ON q.modulo_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE q.id = $1 AND c.instrutor_id = $2
          `, [quizIdNum, user.id]);
          
          if (quizResult.rows.length === 0) {
            console.log(`❌ Quiz ${quizIdNum} não encontrado ou não autorizado`);
            return res.status(404).json({ 
              success: false,
              message: 'Quiz não encontrado ou não autorizado' 
            });
          }

          const quiz = quizResult.rows[0];
          console.log(`✅ Quiz encontrado: ${quiz.titulo}`);

          // Buscar perguntas com opções
          const perguntasResult = await query(`
            SELECT 
              p.id,
              p.quiz_id,
              p.enunciado,
              p.tipo,
              p.pontos,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', o.id,
                    'texto', o.texto,
                    'correta', o.correta
                  ) ORDER BY o.id
                ) FILTER (WHERE o.id IS NOT NULL),
                '[]'::json
              ) as opcoes
            FROM perguntas p
            LEFT JOIN opcoes_resposta o ON p.id = o.pergunta_id
            WHERE p.quiz_id = $1
            GROUP BY p.id
            ORDER BY p.id
          `, [quizIdNum]);

          console.log(`📝 Perguntas encontradas: ${perguntasResult.rows.length}`);

          res.status(200).json({
            success: true,
            data: {
              quiz: {
                id: quiz.id,
                titulo: quiz.titulo,
                modulo_id: quiz.modulo_id,
                modulo_titulo: quiz.modulo_titulo,
                curso_id: quiz.curso_id
              },
              perguntas: perguntasResult.rows
            }
          });
          
        } catch (error) {
          console.error('❌ Erro ao buscar perguntas:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { enunciado, tipo, pontos, opcoes } = req.body;
          
          console.log('📥 Dados recebidos:', { enunciado, tipo, pontos, opcoesLength: opcoes?.length });
          
          if (!enunciado || !opcoes || !Array.isArray(opcoes) || opcoes.length === 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Enunciado e opções são obrigatórios' 
            });
          }

          // Verificar se o quiz pertence ao instrutor
          const quizResult = await query(`
            SELECT q.id 
            FROM quizzes q
            JOIN modulos m ON q.modulo_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE q.id = $1 AND c.instrutor_id = $2
          `, [quizIdNum, user.id]);
          
          if (quizResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Quiz não encontrado ou não autorizado' 
            });
          }

          // Verificar se há pelo menos uma opção correta
          const temCorreta = opcoes.some(opcao => opcao.correta);
          if (!temCorreta) {
            return res.status(400).json({ 
              success: false,
              message: 'Pelo menos uma opção deve ser correta' 
            });
          }

          // Iniciar transação
          const client = await require('../../../../../lib/database-postgres').getPool();
          
          try {
            await client.query('BEGIN');

            // Criar pergunta
            const perguntaResult = await client.query(
              `INSERT INTO perguntas (quiz_id, enunciado, tipo, pontos)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [quizIdNum, enunciado, tipo || 'multipla_escolha', pontos || 1]
            );

            const perguntaId = perguntaResult.rows[0].id;
            console.log(`✅ Pergunta criada com ID: ${perguntaId}`);

            // Criar opções
            for (const opcao of opcoes) {
              await client.query(
                `INSERT INTO opcoes_resposta (pergunta_id, texto, correta)
                 VALUES ($1, $2, $3)`,
                [perguntaId, opcao.texto, opcao.correta || false]
              );
            }

            await client.query('COMMIT');
            console.log(`✅ ${opcoes.length} opções criadas`);

            res.status(201).json({ 
              success: true, 
              message: 'Pergunta criada com sucesso',
              data: { pergunta_id: perguntaId }
            });
            
          } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro na transação:', error);
            throw error;
          } finally {
            client.release();
          }
          
        } catch (error) {
          console.error('❌ Erro ao criar pergunta:', error);
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
    console.error('💥 Erro na API de perguntas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);