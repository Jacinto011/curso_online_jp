import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

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

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    try {
      const [
        totalCursosResult,
        cursosPublicadosResult,
        totalMatriculasResult,
        matriculasPendentesResult,
        pagamentosPendentesResult,
        pagamentosAprovadosResult,
        pagamentosRejeitadosResult,
        totalReceitaResult
      ] = await Promise.all([
        query('SELECT COUNT(*) as count FROM cursos WHERE instrutor_id = $1', [user.id]),
        query("SELECT COUNT(*) as count FROM cursos WHERE instrutor_id = $1 AND status = 'publicado'", [user.id]),
        query(`
          SELECT COUNT(*) as count 
          FROM matriculas m 
          JOIN cursos c ON m.curso_id = c.id 
          WHERE c.instrutor_id = $1
        `, [user.id]),
        query(`
          SELECT COUNT(*) as count 
          FROM matriculas m 
          JOIN cursos c ON m.curso_id = c.id 
          WHERE c.instrutor_id = $1 AND m.status = 'pendente'
        `, [user.id]),
        query(`
          SELECT COUNT(*) as count 
          FROM pagamentos p
          JOIN matriculas m ON p.matricula_id = m.id
          JOIN cursos c ON m.curso_id = c.id
          WHERE c.instrutor_id = $1 AND p.status = 'pendente'
        `, [user.id]),
        query(`
          SELECT COUNT(*) as count 
          FROM pagamentos p
          JOIN matriculas m ON p.matricula_id = m.id
          JOIN cursos c ON m.curso_id = c.id
          WHERE c.instrutor_id = $1 AND p.status = 'pago'
        `, [user.id]),
        query(`
          SELECT COUNT(*) as count 
          FROM pagamentos p
          JOIN matriculas m ON p.matricula_id = m.id
          JOIN cursos c ON m.curso_id = c.id
          WHERE c.instrutor_id = $1 AND p.status = 'rejeitado'
        `, [user.id]),
        query(`
          SELECT COALESCE(SUM(p.valor), 0) as total
          FROM pagamentos p
          JOIN matriculas m ON p.matricula_id = m.id
          JOIN cursos c ON m.curso_id = c.id
          WHERE c.instrutor_id = $1 AND p.status = 'pago'
        `, [user.id])
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCursos: parseInt(totalCursosResult.rows[0].count),
          cursosPublicados: parseInt(cursosPublicadosResult.rows[0].count),
          totalMatriculas: parseInt(totalMatriculasResult.rows[0].count),
          matriculasPendentes: parseInt(matriculasPendentesResult.rows[0].count),
          pagamentosPendentes: parseInt(pagamentosPendentesResult.rows[0].count),
          pagamentosAprovados: parseInt(pagamentosAprovadosResult.rows[0].count),
          pagamentosRejeitados: parseInt(pagamentosRejeitadosResult.rows[0].count),
          totalReceita: parseFloat(totalReceitaResult.rows[0].total)
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do instrutor:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de stats do instrutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);