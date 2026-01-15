import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }

  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    const { cursoId } = req.body;

    if (!cursoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do curso é obrigatório' 
      });
    }

    // Verificar se o curso existe e está publicado
    const cursoResult = await query(`
      SELECT c.*, u.nome as instrutor_nome 
      FROM cursos c 
      JOIN usuarios u ON c.instrutor_id = u.id 
      WHERE c.id = $1 AND c.status = 'publicado'
    `, [cursoId]);

    if (cursoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso não encontrado ou não está publicado' 
      });
    }

    const curso = cursoResult.rows[0];

    // Verificar se já está matriculado
    const matriculaExistenteResult = await query(`
      SELECT * FROM matriculas 
      WHERE estudante_id = $1 AND curso_id = $2
    `, [user.id, cursoId]);

    if (matriculaExistenteResult.rows.length > 0) {
      const matricula = matriculaExistenteResult.rows[0];
      return res.status(200).json({ 
        success: true, 
        message: 'Já matriculado',
        matricula_id: matricula.id,
        status: matricula.status,
        pagamento_necessario: false
      });
    }

    // Determinar status inicial baseado no tipo de curso
    let status = 'ativa';
    let pagamento_confirmado = true;
    let instrutor_confirmado = true;
    let pagamento_necessario = false;

    if (!curso.gratuito && curso.preco > 0) {
      // Cursos pagos iniciam como pendentes
      status = 'pendente';
      pagamento_confirmado = false;
      instrutor_confirmado = false;
      pagamento_necessario = true;
    }

    // Criar matrícula com RETURNING para obter o ID
    const matriculaResult = await query(`
      INSERT INTO matriculas 
      (estudante_id, curso_id, status, pagamento_confirmado, instrutor_confirmado) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [user.id, cursoId, status, pagamento_confirmado, instrutor_confirmado]);

    const matriculaId = matriculaResult.rows[0].id;

    // Se for curso gratuito, criar progresso inicial
    if (!pagamento_necessario) {
      // Obter módulos do curso
      const modulosResult = await query(`
        SELECT id FROM modulos WHERE curso_id = $1 ORDER BY ordem
      `, [cursoId]);

      for (const modulo of modulosResult.rows) {
        await query(`
          INSERT INTO progresso (matricula_id, modulo_id) 
          VALUES ($1, $2)
        `, [matriculaId, modulo.id]);
      }

      // Criar notificação de boas-vindas
      await query(`
        INSERT INTO notificacoes 
        (usuario_id, tipo, titulo, mensagem, link) 
        VALUES ($1, 'curso', 'Matrícula confirmada', 
                'Sua matrícula no curso "${curso.titulo}" foi confirmada! Comece a estudar agora.',
                '/student/cursos/${cursoId}')
      `, [user.id]);
    }

    return res.status(200).json({
      success: true,
      message: pagamento_necessario 
        ? 'Matrícula pendente criada. Aguarde envio do comprovante.' 
        : 'Matrícula realizada com sucesso!',
      matricula_id: matriculaId,
      pagamento_necessario: pagamento_necessario,
      curso: {
        id: curso.id,
        titulo: curso.titulo,
        preco: curso.preco,
        instrutor_id: curso.instrutor_id,
        instrutor_nome: curso.instrutor_nome,
        gratuito: curso.gratuito
      }
    });

  } catch (error) {
    console.error('Erro ao matricular:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor: ' + error.message 
    });
  }
}

export default withCors(handler);