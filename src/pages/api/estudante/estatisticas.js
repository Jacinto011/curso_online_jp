import { initializeDatabase } from '../../../lib/database';
import { authenticate } from '../../../lib/auth';

export default async function handler(req, res) {
  const db = await initializeDatabase();
  
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  try {
    // Cursos ativos
    const cursosAtivos = await db.get(
      `SELECT COUNT(*) as count 
       FROM matriculas 
       WHERE estudante_id = ? AND status = 'ativa'`,
      [user.id]
    );

    // Cursos concluídos
    const cursosConcluidos = await db.get(
      `SELECT COUNT(*) as count 
       FROM matriculas 
       WHERE estudante_id = ? AND status = 'concluida'`,
      [user.id]
    );

    // Progresso médio (simplificado)
    const progressoMedio = await db.get(
      `SELECT AVG(CASE 
          WHEN m.status = 'concluida' THEN 100
          ELSE 0 
        END) as progresso
       FROM matriculas m
       WHERE m.estudante_id = ?`,
      [user.id]
    );

    // Total de certificados
    const certificados = await db.get(
      `SELECT COUNT(*) as count 
       FROM certificados c
       JOIN matriculas m ON c.matricula_id = m.id
       WHERE m.estudante_id = ?`,
      [user.id]
    );

    res.status(200).json({
      cursosAtivos: cursosAtivos.count,
      cursosConcluidos: cursosConcluidos.count,
      progressoMedio: Math.round(progressoMedio.progresso || 0),
      certificados: certificados.count
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do estudante:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}