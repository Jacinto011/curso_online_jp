import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    // Buscar matrículas do estudante
    const matriculasResult = await query(`
      SELECT 
        m.id as matricula_id,
        m.status as matricula_status,
        m.data_matricula,
        m.data_conclusao,
        m.pagamento_confirmado,
        m.instrutor_confirmado,
        c.*,
        u.nome as instrutor_nome,
        u.avatar_url as instrutor_avatar
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON c.instrutor_id = u.id
      WHERE m.estudante_id = $1
      ORDER BY m.data_matricula DESC
    `, [user.id]);

    // Para cada matrícula, calcular progresso
    const cursosComProgresso = await Promise.all(
      matriculasResult.rows.map(async (matricula) => {
        // Calcular progresso do curso
        const progressoResult = await query(`
          SELECT 
            COUNT(DISTINCT p.material_id) as aulas_concluidas,
            COUNT(DISTINCT mat.id) as total_aulas
          FROM modulos m
          LEFT JOIN materiais mat ON m.id = mat.modulo_id
          LEFT JOIN progresso p ON mat.id = p.material_id 
            AND p.matricula_id = $1 
            AND p.concluido = true
          WHERE m.curso_id = $2
        `, [matricula.matricula_id, matricula.id]);

        let progresso = 0;
        if (progressoResult.rows.length > 0 && 
            progressoResult.rows[0].total_aulas > 0) {
          progresso = Math.round(
            (parseInt(progressoResult.rows[0].aulas_concluidas) / 
             parseInt(progressoResult.rows[0].total_aulas)) * 100
          );
        }

        return {
          curso: {
            id: matricula.id,
            titulo: matricula.titulo,
            descricao: matricula.descricao,
            imagem_url: matricula.imagem_url,
            categoria: matricula.categoria,
            nivel: matricula.nivel,
            instrutor_nome: matricula.instrutor_nome,
            instrutor_avatar: matricula.instrutor_avatar
          },
          matricula: {
            id: matricula.matricula_id,
            status: matricula.matricula_status,
            data_matricula: matricula.data_matricula,
            data_conclusao: matricula.data_conclusao,
            pagamento_confirmado: matricula.pagamento_confirmado,
            instrutor_confirmado: matricula.instrutor_confirmado
          },
          progresso: progresso
        };
      })
    );

    return res.status(200).json({
      cursos: cursosComProgresso,
      total: cursosComProgresso.length
    });

  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export default withCors(handler);