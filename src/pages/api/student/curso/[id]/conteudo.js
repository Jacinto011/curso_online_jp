// src/pages/api/student/curso/[id]/conteudo.js
import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const { id: cursoId } = req.query;

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Verificar se está matriculado e ativo
    const matriculaResult = await query(`
      SELECT m.* FROM matriculas m
      WHERE m.estudante_id = $1 
        AND m.curso_id = $2 
        AND m.status IN ('ativa', 'concluida')
    `, [user.id, cursoId]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não está matriculado neste curso ou a matrícula não está ativa' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Buscar curso
    const cursoResult = await query(`
      SELECT c.*, u.nome as instrutor_nome 
      FROM cursos c
      JOIN usuarios u ON c.instrutor_id = u.id
      WHERE c.id = $1
    `, [cursoId]);

    if (cursoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Curso não encontrado' 
      });
    }

    const curso = cursoResult.rows[0];

    // Buscar módulos
    const modulosResult = await query(`
      SELECT 
        m.*,
        -- Verificar se o módulo foi concluído
        EXISTS (
          SELECT 1 FROM progresso p
          WHERE p.matricula_id = $1 
            AND p.modulo_id = m.id 
            AND p.concluido = true
        ) as concluido,
        -- Verificar se o módulo anterior foi concluído
        (
          SELECT CASE 
            WHEN m.ordem = 1 THEN true  -- Primeiro módulo sempre disponível
            ELSE (
              SELECT p.concluido 
              FROM progresso p
              JOIN modulos ant ON p.modulo_id = ant.id
              WHERE p.matricula_id = $2 
                AND ant.ordem = m.ordem - 1
              LIMIT 1
            )
          END
        ) as modulo_anterior_concluido,
        -- Buscar quiz do módulo se existir
        q.id as quiz_id,
        q.titulo as quiz_titulo,
        q.pontuacao_minima,
        -- Verificar se quiz foi aprovado
        (
          SELECT r.aprovado 
          FROM resultados_quiz r
          WHERE r.matricula_id = $3 
            AND r.quiz_id = q.id
          LIMIT 1
        ) as quiz_aprovado
      FROM modulos m
      LEFT JOIN quizzes q ON m.id = q.modulo_id
      WHERE m.curso_id = $4
      ORDER BY m.ordem ASC
    `, [matricula.id, matricula.id, matricula.id, cursoId]);

    const modulos = modulosResult.rows;

    // Buscar materiais de cada módulo
    for (let modulo of modulos) {
      const materiaisResult = await query(`
        SELECT 
          mat.*,
          -- Verificar se material foi concluído
          EXISTS (
            SELECT 1 FROM progresso p
            WHERE p.matricula_id = $1 
              AND p.material_id = mat.id 
              AND p.concluido = true
          ) as concluido
        FROM materiais mat
        WHERE mat.modulo_id = $2
        ORDER BY mat.ordem ASC
      `, [matricula.id, modulo.id]);
      
      modulo.materiais = materiaisResult.rows;
    }

    // Calcular progresso geral
    const totalModulos = modulos.length;
    const modulosConcluidos = modulos.filter(m => m.concluido).length;
    const progresso = totalModulos > 0 ? Math.round((modulosConcluidos / totalModulos) * 100) : 0;

    // Verificar se curso foi concluído
    const cursoConcluidoResult = await query(`
      SELECT status FROM matriculas 
      WHERE id = $1 AND status = 'concluida'
    `, [matricula.id]);

    const cursoConcluidoStatus = cursoConcluidoResult.rows.length > 0;

    // Retornar na resposta
    res.status(200).json({
      success: true,
      data: {
        curso,
        matricula,
        modulos,
        progresso: {
          totalModulos,
          modulosConcluidos,
          percentual: progresso,
          cursoConcluido: cursoConcluidoStatus
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);