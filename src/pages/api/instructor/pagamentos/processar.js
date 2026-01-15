import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['PUT']
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

    const { pagamento_id, acao, observacoes } = req.body;

    if (!pagamento_id || !acao) {
      return res.status(400).json({ 
        success: false,
        message: 'Pagamento ID e ação são obrigatórios' 
      });
    }

    // Verificar se o pagamento existe e pertence ao instrutor
    const pagamentoResult = await query(`
      SELECT p.*, c.instrutor_id 
      FROM pagamentos p
      JOIN matriculas m ON p.matricula_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      WHERE p.id = $1
    `, [pagamento_id]);

    if (pagamentoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Pagamento não encontrado' 
      });
    }

    const pagamento = pagamentoResult.rows[0];

    if (parseInt(pagamento.instrutor_id) !== parseInt(user.id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Acesso negado. Este pagamento não pertence a você.' 
      });
    }

    if (pagamento.status !== 'pendente') {
      return res.status(400).json({ 
        success: false,
        message: 'Este pagamento já foi processado' 
      });
    }

    // Definir novo status com base na ação
    let novoStatus;
    let statusMatricula;
    let acaoDescricao;

    if (acao === 'aprovar') {
      novoStatus = 'pago';
      statusMatricula = 'ativa';
      acaoDescricao = 'Pagamento aprovado pelo instrutor';
    } else if (acao === 'rejeitar') {
      novoStatus = 'rejeitado';
      statusMatricula = 'pendente';
      acaoDescricao = 'Pagamento rejeitado pelo instrutor';
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Ação inválida' 
      });
    }

    // Iniciar transação
    const client = await require('../../../../lib/database-postgres').getPool();
    
    try {
      await client.query('BEGIN');

      // 1. Atualizar status do pagamento
      await client.query(
        `UPDATE pagamentos SET 
          status = $1, 
          data_confirmacao = CURRENT_TIMESTAMP,
          observacoes = COALESCE($2, observacoes)
        WHERE id = $3`,
        [novoStatus, observacoes || acaoDescricao, pagamento_id]
      );

      // 2. Criar histórico do pagamento
      await client.query(
        `INSERT INTO historico_pagamento (pagamento_id, status, observacoes, usuario_id)
         VALUES ($1, $2, $3, $4)`,
        [pagamento_id, novoStatus, `Processado por instrutor: ${observacoes || acaoDescricao}`, user.id]
      );

      // 3. Atualizar status da matrícula
      await client.query(
        `UPDATE matriculas SET 
          status = $1,
          pagamento_confirmado = $2,
          instrutor_confirmado = $2
        WHERE id = $3`,
        [statusMatricula, acao === 'aprovar', pagamento.matricula_id]
      );

      // 4. Criar notificação para o estudante
      const estudanteResult = await client.query(
        'SELECT estudante_id FROM matriculas WHERE id = $1',
        [pagamento.matricula_id]
      );

      const estudanteId = estudanteResult.rows[0].estudante_id;

      const cursoResult = await client.query(
        'SELECT titulo FROM cursos WHERE id = (SELECT curso_id FROM matriculas WHERE id = $1)',
        [pagamento.matricula_id]
      );

      const cursoTitulo = cursoResult.rows[0].titulo;

      const mensagemNotificacao = acao === 'aprovar' 
        ? `Seu pagamento para o curso "${cursoTitulo}" foi aprovado! Sua matrícula está ativa.`
        : `Seu pagamento para o curso "${cursoTitulo}" foi rejeitado. Por favor, entre em contato com o instrutor.`;

      await client.query(
        `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          estudanteId,
          acao === 'aprovar' ? 'pagamento_aprovado' : 'pagamento_rejeitado',
          acao === 'aprovar' ? 'Pagamento Aprovado!' : 'Pagamento Rejeitado',
          mensagemNotificacao,
          acao === 'aprovar' ? '/student/cursos' : '/student/matriculas'
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: `Pagamento ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`,
        data: {
          status: novoStatus,
          pagamento_id: pagamento_id
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);