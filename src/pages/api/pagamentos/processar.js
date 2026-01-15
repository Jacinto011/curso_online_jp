import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    switch (req.method) {
      case 'POST':
        try {
          const { matricula_id, metodo_pagamento_id, comprovante_url } = req.body;
          
          if (!matricula_id) {
            return res.status(400).json({ 
              success: false,
              message: 'ID da matrícula é obrigatório' 
            });
          }
          
          // Buscar matrícula
          const matriculaResult = await query(
            `SELECT m.*, c.titulo as curso_titulo, c.instrutor_id, c.preco
             FROM matriculas m
             JOIN cursos c ON m.curso_id = c.id
             WHERE m.id = $1 AND m.estudante_id = $2`,
            [matricula_id, user.id]
          );
          
          if (matriculaResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Matrícula não encontrada' 
            });
          }
          
          const matricula = matriculaResult.rows[0];
          
          // Se já existe pagamento pendente
          const pagamentoExistenteResult = await query(
            'SELECT * FROM pagamentos WHERE matricula_id = $1 AND status = $2',
            [matricula_id, 'pendente']
          );
          
          if (pagamentoExistenteResult.rows.length > 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Já existe um pagamento pendente para esta matrícula' 
            });
          }
          
          // Criar pagamento
          const pagamentoResult = await query(
            `INSERT INTO pagamentos (
              matricula_id, metodo_pagamento_id, valor, 
              status, comprovante_url, data_pagamento
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id`,
            [
              matricula_id,
              metodo_pagamento_id,
              matricula.preco || 0,
              'pendente',
              comprovante_url
            ]
          );
          
          const pagamentoId = pagamentoResult.rows[0].id;
          
          // Criar histórico
          await query(
            `INSERT INTO historico_pagamento (
              pagamento_id, status, usuario_id, observacoes
            ) VALUES ($1, $2, $3, $4)`,
            [
              pagamentoId,
              'pendente',
              user.id,
              'Pagamento criado pelo estudante'
            ]
          );
          
          // Criar notificação para o instrutor
          await query(
            `INSERT INTO notificacoes (
              usuario_id, tipo, titulo, mensagem, link
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              matricula.instrutor_id,
              'pagamento',
              'Novo pagamento pendente',
              `O estudante ${user.nome} enviou um comprovante de pagamento para o curso "${matricula.curso_titulo}"`,
              `/instructor/pagamentos/${pagamentoId}`
            ]
          );
          
          // Atualizar status da matrícula
          await query(
            'UPDATE matriculas SET status = $1 WHERE id = $2',
            ['pendente_pagamento', matricula_id]
          );
          
          res.status(201).json({
            success: true,
            message: 'Comprovante enviado com sucesso. Aguarde a confirmação do instrutor.',
            data: {
              pagamento_id: pagamentoId
            }
          });
          
        } catch (error) {
          console.error('Erro ao processar pagamento:', error);
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
          allowed: ['POST']
        });
    }
  } catch (error) {
    console.error('Erro na API de pagamento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);