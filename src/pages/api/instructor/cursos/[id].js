import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { id: cursoId } = req.query; // Renomeando para ficar claro que é ID do curso

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    try {
      if (!cursoId) {
        return res.status(400).json({ 
          success: false,
          message: 'ID do curso é obrigatório' 
        });
      }

      // Buscar o curso específico e verificar se pertence ao instrutor
      const result = await query(`
        SELECT 
          c.*,
          u.nome as instrutor_nome,
          u.email as instrutor_email,
          u.avatar_url as instrutor_avatar,
          u.bio as instrutor_bio,
          COUNT(DISTINCT m.id) as total_modulos,
          COUNT(DISTINCT mat.id) as total_matriculas,
          (
            SELECT COUNT(DISTINCT mat2.id)
            FROM materiais mat2
            JOIN modulos m2 ON mat2.modulo_id = m2.id
            WHERE m2.curso_id = c.id
          ) as total_materiais
        FROM cursos c
        JOIN usuarios u ON c.instrutor_id = u.id
        LEFT JOIN modulos m ON c.id = m.curso_id
        LEFT JOIN matriculas mat ON c.id = mat.curso_id
        WHERE c.id = $1 AND c.instrutor_id = $2
        GROUP BY c.id, u.id
      `, [cursoId, user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Curso não encontrado ou não pertence a você' 
        });
      }

      const curso = result.rows[0];

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
      `, [cursoId]);

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
            conteudo,
            data_criacao
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
          m.titulo as modulo_titulo,
          m.ordem as modulo_ordem
        FROM quizzes q
        JOIN modulos m ON q.modulo_id = m.id
        WHERE m.curso_id = $1
        ORDER BY m.ordem ASC, q.titulo ASC
      `, [cursoId]);

      const quizzes = quizzesResult.rows;

      // Buscar matrículas do curso
      const matriculasResult = await query(`
        SELECT 
          mat.*,
          u.nome as estudante_nome,
          u.email as estudante_email,
          (
            SELECT COUNT(DISTINCT p.modulo_id)
            FROM progresso p
            WHERE p.matricula_id = mat.id AND p.concluido = true
          ) as modulos_concluidos,
          COUNT(DISTINCT m.id) as total_modulos
        FROM matriculas mat
        JOIN usuarios u ON mat.estudante_id = u.id
        LEFT JOIN modulos m ON mat.curso_id = m.curso_id
        WHERE mat.curso_id = $1
        GROUP BY mat.id, u.id
        ORDER BY mat.data_matricula DESC
      `, [cursoId]);

      res.status(200).json({
        success: true,
        data: {
          curso,
          modulos,
          quizzes,
          matriculas: matriculasResult.rows,
          estatisticas: {
            total_modulos: parseInt(curso.total_modulos) || 0,
            total_materiais: parseInt(curso.total_materiais) || 0,
            total_matriculas: parseInt(curso.total_matriculas) || 0,
            total_quizzes: quizzes.length,
            // Cálculo de progresso médio dos estudantes
            progresso_medio: calcularProgressoMedio(matriculasResult.rows)
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar curso do instrutor:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de curso do instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Função auxiliar para calcular progresso médio
function calcularProgressoMedio(matriculas) {
  if (matriculas.length === 0) return 0;
  
  const totalProgresso = matriculas.reduce((acc, matricula) => {
    const totalModulos = parseInt(matricula.total_modulos) || 0;
    const modulosConcluidos = parseInt(matricula.modulos_concluidos) || 0;
    
    if (totalModulos === 0) return acc;
    
    const progresso = (modulosConcluidos / totalModulos) * 100;
    return acc + progresso;
  }, 0);
  
  return Math.round(totalProgresso / matriculas.length);
}

export default withCors(handler);