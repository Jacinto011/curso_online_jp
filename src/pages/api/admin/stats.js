import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
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
    // Buscar estatísticas em paralelo
    const [
      totalUsuariosResult,
      totalCursosResult,
      totalMatriculasResult,
      pedidosInstrutorResult,
      totalInstrutoresResult,
      totalEstudantesResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM usuarios'),
      query('SELECT COUNT(*) as count FROM cursos'),
      query('SELECT COUNT(*) as count FROM matriculas'),
      query("SELECT COUNT(*) as count FROM pedidos_instrutor WHERE status = 'pendente'"),
      query("SELECT COUNT(*) as count FROM usuarios WHERE role = 'instructor'"),
      query("SELECT COUNT(*) as count FROM usuarios WHERE role = 'student'")
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsuarios: parseInt(totalUsuariosResult.rows[0].count),
        totalCursos: parseInt(totalCursosResult.rows[0].count),
        totalMatriculas: parseInt(totalMatriculasResult.rows[0].count),
        pedidosInstrutor: parseInt(pedidosInstrutorResult.rows[0].count),
        totalInstrutores: parseInt(totalInstrutoresResult.rows[0].count),
        totalEstudantes: parseInt(totalEstudantesResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);