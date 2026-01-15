import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['POST']
      });
    }

    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { matricula_id } = req.body;
    
    if (!matricula_id) {
      return res.status(400).json({ 
        success: false,
        message: 'ID da matrícula é obrigatório' 
      });
    }

    // Verificar se a matrícula pertence a um curso do instrutor
    const matriculaResult = await query(`
      SELECT m.*, c.titulo as curso_titulo, u.nome as estudante_nome
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON m.estudante_id = u.id
      WHERE m.id = $1 AND c.instrutor_id = $2 AND m.status = 'concluida'
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matrícula não encontrada, não autorizada ou não concluída' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Verificar se já existe certificado
    const certificadoExistenteResult = await query(
      'SELECT id FROM certificados WHERE matricula_id = $1',
      [matricula_id]
    );

    if (certificadoExistenteResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Certificado já emitido para esta matrícula' 
      });
    }

    // Gerar código único
    const codigoVerificacao = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Criar certificado com RETURNING
    const certificadoResult = await query(
      `INSERT INTO certificados (matricula_id, codigo_verificacao) 
       VALUES ($1, $2)
       RETURNING id`,
      [matricula_id, codigoVerificacao]
    );

    // Atualizar status da matrícula para concluída
    await query(
      'UPDATE matriculas SET status = $1, data_conclusao = CURRENT_TIMESTAMP WHERE id = $2',
      ['concluida', matricula_id]
    );

    res.status(201).json({
      success: true,
      message: 'Certificado emitido com sucesso',
      data: {
        id: certificadoResult.rows[0].id,
        codigo_verificacao: codigoVerificacao,
        estudante_nome: matricula.estudante_nome,
        curso_titulo: matricula.curso_titulo
      }
    });
    
  } catch (error) {
    console.error('Erro ao emitir certificado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);