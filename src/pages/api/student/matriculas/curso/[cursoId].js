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

    const { cursoId } = req.query;

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Buscar matrícula do usuário neste curso
    const matriculaResult = await query(`
      SELECT 
        m.*,
        COUNT(DISTINCT p.modulo_id) as modulos_concluidos,
        COUNT(DISTINCT mod.id) as total_modulos,
        CASE 
          WHEN COUNT(DISTINCT mod.id) > 0 
          THEN ROUND(COUNT(DISTINCT p.modulo_id) * 100.0 / COUNT(DISTINCT mod.id), 0)
          ELSE 0 
        END as progresso
      FROM matriculas m
      LEFT JOIN modulos mod ON m.curso_id = mod.curso_id
      LEFT JOIN progresso p ON m.id = p.matricula_id AND p.modulo_id = mod.id AND p.concluido = true
      WHERE m.estudante_id = $1 AND m.curso_id = $2
      GROUP BY m.id, m.estudante_id, m.curso_id, m.status, m.data_matricula, 
               m.data_conclusao, m.pagamento_confirmado, m.instrutor_confirmado
    `, [user.id, cursoId]);

    res.status(200).json({
      success: true,
      data: {
        matricula: matriculaResult.rows[0] || null
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);