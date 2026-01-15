import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { status } = req.query;

    // Query base para buscar pagamentos do instrutor
    let sql = `
      SELECT 
        p.id,
        p.matricula_id,
        p.valor,
        p.status,
        p.comprovante_url,
        p.codigo_transacao,
        p.data_pagamento,
        p.data_confirmacao,
        p.observacoes,
        p.metodo_pagamento_id,
        mp.nome as metodo_pagamento_nome,
        m.estudante_id,
        m.curso_id,
        m.status as matricula_status,
        m.data_matricula,
        m.pagamento_confirmado,
        m.instrutor_confirmado,
        u.nome as estudante_nome,
        u.email as estudante_email,
        c.titulo as curso_titulo,
        ui.nome as instrutor_nome
      FROM pagamentos p
      JOIN matriculas m ON p.matricula_id = m.id
      JOIN usuarios u ON m.estudante_id = u.id
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios ui ON c.instrutor_id = ui.id
      LEFT JOIN metodos_pagamento mp ON p.metodo_pagamento_id = mp.id
      WHERE c.instrutor_id = $1
    `;

    const params = [user.id];

    // Adicionar filtro por status
    if (status && status !== 'todos') {
      sql += ` AND p.status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY p.data_pagamento DESC`;

    const result = await query(sql, params);

    // Formatar resposta
    const pagamentosFormatados = result.rows.map(pagamento => ({
      id: pagamento.id,
      codigo_transacao: pagamento.codigo_transacao || `PAY-${pagamento.id.toString().padStart(6, '0')}`,
      estudante_nome: pagamento.estudante_nome,
      estudante_email: pagamento.estudante_email,
      curso_titulo: pagamento.curso_titulo,
      valor: parseFloat(pagamento.valor),
      status: pagamento.status,
      metodo_pagamento_nome: pagamento.metodo_pagamento_nome || 'Transferência',
      data_pagamento: pagamento.data_pagamento,
      comprovante_url: pagamento.comprovante_url,
      observacoes: pagamento.observacoes,
      matricula_id: pagamento.matricula_id,
      matricula_status: pagamento.matricula_status,
      pagamento_confirmado: pagamento.pagamento_confirmado,
      instrutor_confirmado: pagamento.instrutor_confirmado,
      data_matricula: pagamento.data_matricula
    }));

    res.status(200).json({
      success: true,
      data: pagamentosFormatados
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);