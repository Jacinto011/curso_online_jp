import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

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

    switch (req.method) {
      case 'GET':
        try {
          // Cursos disponíveis (não matriculados)
          const cursosDisponiveisResult = await query(`
            SELECT 
              c.*,
              u.nome as instrutor_nome,
              u.avatar_url as instrutor_avatar,
              COUNT(DISTINCT m.id) as total_modulos,
              COUNT(DISTINCT mat.id) as total_matriculas
            FROM cursos c
            JOIN usuarios u ON c.instrutor_id = u.id
            LEFT JOIN modulos m ON c.id = m.curso_id
            LEFT JOIN matriculas mat ON c.id = mat.curso_id
            WHERE c.status = 'publicado'
              AND c.id NOT IN (
                SELECT curso_id FROM matriculas 
                WHERE estudante_id = $1 AND status IN ('ativa', 'concluida')
              )
            GROUP BY c.id, u.id, u.nome, u.avatar_url
            ORDER BY c.data_criacao DESC
          `, [user.id]);

          // Cursos matriculados - CORRIGIDO: usando curso.curso.id
          const cursosMatriculadosResult = await query(`
            SELECT 
              m.id as matricula_id,
              m.status as status_matricula,
              m.data_matricula,
              m.data_conclusao,
              c.id as curso_id,
              c.titulo,
              c.descricao,
              c.instrutor_id,
              c.preco,
              c.gratuito,
              c.duracao_estimada,
              c.imagem_url,
              c.categoria,
              c.nivel,
              c.status as curso_status,
              c.data_criacao,
              u.nome as instrutor_nome,
              u.avatar_url as instrutor_avatar,
              COUNT(DISTINCT md.id) as total_modulos,
              (
                SELECT COUNT(DISTINCT p.modulo_id) 
                FROM progresso p
                WHERE p.matricula_id = m.id AND p.concluido = true
              ) as modulos_concluidos
            FROM matriculas m
            JOIN cursos c ON m.curso_id = c.id
            JOIN usuarios u ON c.instrutor_id = u.id
            LEFT JOIN modulos md ON c.id = md.curso_id
            WHERE m.estudante_id = $1 AND m.status IN ('ativa', 'concluida')
            GROUP BY 
              m.id, m.status, m.data_matricula, m.data_conclusao,
              c.id, c.titulo, c.descricao, c.instrutor_id, c.preco, c.gratuito,
              c.duracao_estimada, c.imagem_url, c.categoria, c.nivel, c.status,
              c.data_criacao, u.nome, u.avatar_url
            ORDER BY m.data_matricula DESC
          `, [user.id]);

          // Formatar resposta para manter compatibilidade
          const cursosDisponiveisFormatados = cursosDisponiveisResult.rows.map(curso => ({
            id: curso.id,
            titulo: curso.titulo,
            descricao: curso.descricao,
            imagem_url: curso.imagem_url,
            categoria: curso.categoria,
            nivel: curso.nivel,
            instrutor_nome: curso.instrutor_nome,
            instrutor_avatar: curso.instrutor_avatar,
            preco: curso.preco,
            gratuito: curso.gratuito,
            duracao_estimada: curso.duracao_estimada,
            total_modulos: parseInt(curso.total_modulos) || 0,
            total_matriculas: parseInt(curso.total_matriculas) || 0,
            status: curso.status,
            data_criacao: curso.data_criacao
          }));

          const cursosMatriculadosFormatados = cursosMatriculadosResult.rows.map(curso => {
            const progresso = curso.total_modulos > 0 
              ? Math.round((curso.modulos_concluidos / curso.total_modulos) * 100)
              : 0;
            
            return {
              curso: {
                id: curso.curso_id,
                titulo: curso.titulo,
                descricao: curso.descricao,
                imagem_url: curso.imagem_url,
                categoria: curso.categoria,
                nivel: curso.nivel,
                instrutor_nome: curso.instrutor_nome,
                instrutor_avatar: curso.instrutor_avatar,
                preco: curso.preco,
                gratuito: curso.gratuito,
                duracao_estimada: curso.duracao_estimada,
                status: curso.curso_status
              },
              matricula: {
                id: curso.matricula_id,
                status: curso.status_matricula,
                data_matricula: curso.data_matricula,
                data_conclusao: curso.data_conclusao
              },
              progresso: progresso,
              total_modulos: curso.total_modulos || 0,
              modulos_concluidos: curso.modulos_concluidos || 0
            };
          });

          res.status(200).json({
            success: true,
            data: {
              disponiveis: cursosDisponiveisFormatados,
              matriculados: cursosMatriculadosFormatados
            }
          });
          
        } catch (error) {
          console.error('Erro ao buscar cursos:', error);
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
          allowed: ['GET']
        });
    }
  } catch (error) {
    console.error('Erro na API de cursos do estudante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);