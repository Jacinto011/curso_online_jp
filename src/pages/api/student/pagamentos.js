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

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['POST']
      });
    }

    const { curso_id, metodo_pagamento, valor, comprovante_url, observacoes } = req.body;
    
    if (!curso_id || !metodo_pagamento || !valor || !comprovante_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos' 
      });
    }

    // Verificar se curso existe e é pago
    const cursoResult = await query(`
      SELECT * FROM cursos 
      WHERE id = $1 AND status = 'publicado' AND gratuito = false
    `, [curso_id]);
    
    if (cursoResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso não encontrado ou gratuito' 
      });
    }

    const curso = cursoResult.rows[0];

    // Verificar se já está matriculado
    const matriculaResult = await query(`
      SELECT id FROM matriculas 
      WHERE estudante_id = $1 AND curso_id = $2
    `, [user.id, curso_id]);
    
    if (matriculaResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Você já está matriculado neste curso' 
      });
    }

    // Iniciar transação
    const client = await require('../../../lib/database-postgres').getPool().connect();
    
    try {
      await client.query('BEGIN');

      // Criar matrícula suspensa
      const matriculaResult = await client.query(
        `INSERT INTO matriculas 
         (estudante_id, curso_id, status, pagamento_confirmado, instrutor_confirmado)
         VALUES ($1, $2, 'suspensa', false, false)
         RETURNING id`,
        [user.id, curso_id]
      );

      const matriculaId = matriculaResult.rows[0].id;

      // Encontrar ID do método de pagamento
      let metodoPagamentoId = null;
      
      // Se for um código conhecido, buscar da tabela
      if (['bci', 'standard', 'bim', 'absa', 'ecobank', 'mpesa', 'emola', 'airtel_money'].includes(metodo_pagamento)) {
        const metodoResult = await client.query(
          'SELECT id FROM metodos_pagamento WHERE codigo = $1',
          [metodo_pagamento]
        );
        metodoPagamentoId = metodoResult.rows[0]?.id || null;
      }

      // Gerar código de transação
      const codigoTransacao = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Criar registro de pagamento
      const pagamentoResult = await client.query(
        `INSERT INTO pagamentos 
         (matricula_id, metodo_pagamento_id, valor, status, comprovante_url, 
          codigo_transacao, observacoes, data_pagamento)
         VALUES ($1, $2, $3, 'pendente', $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING id`,
        [matriculaId, metodoPagamentoId, valor, comprovante_url, codigoTransacao, observacoes || null]
      );

      const pagamentoId = pagamentoResult.rows[0].id;

      // Registrar histórico
      await client.query(
        `INSERT INTO historico_pagamento 
         (pagamento_id, status, observacoes, usuario_id)
         VALUES ($1, 'pendente', 'Pagamento enviado pelo estudante', $2)`,
        [pagamentoId, user.id]
      );

      await client.query('COMMIT');

      // Enviar notificação para o instrutor
      const instrutorId = curso.instrutor_id;
      await client.query(
        `INSERT INTO notificacoes 
         (usuario_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'pagamento', 'Novo pagamento recebido', 
                 $2, '/instructor/pagamentos')`,
        [instrutorId, 
          `O estudante ${user.nome} enviou um pagamento para o curso "${curso.titulo}" no valor de MZN ${parseFloat(valor).toFixed(2)}. Código: ${codigoTransacao}`]
      );

      res.status(201).json({
        success: true,
        message: 'Pagamento registrado com sucesso! Aguarde confirmação.',
        matricula_id: matriculaId,
        pagamento_id: pagamentoId,
        codigo_transacao: codigoTransacao
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao processar pagamento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erro na API de checkout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);