import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acesso não autorizado. Apenas administradores.' 
      });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'PUT':
        try {
          const { status, observacoes } = req.body;
          
          if (!status) {
            return res.status(400).json({ 
              success: false,
              message: 'Status é obrigatório' 
            });
          }
          
          // Buscar pagamento
          const pagamentoResult = await query(
            'SELECT * FROM pagamentos WHERE id = $1',
            [id]
          );
          
          if (pagamentoResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Pagamento não encontrado' 
            });
          }
          
          const pagamento = pagamentoResult.rows[0];
          const statusAntigo = pagamento.status;
          
          // Atualizar status do pagamento
          await query(
            'UPDATE pagamentos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
          );
          
          // Registrar no histórico usando data_registro
          await query(
            `INSERT INTO historico_pagamento (
              pagamento_id, status, usuario_id, observacoes, data_registro
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [
              id,
              status,
              user.id,
              observacoes || `Status alterado por ${user.nome} (Admin). Status anterior: ${statusAntigo}`
            ]
          );
          
          // Buscar matrícula associada
          const matriculaResult = await query(
            `SELECT m.*, u.nome as estudante_nome, c.titulo as curso_titulo,
                    u.id as estudante_id, c.instrutor_id
             FROM matriculas m
             JOIN usuarios u ON m.estudante_id = u.id
             JOIN cursos c ON m.curso_id = c.id
             WHERE m.id = $1`,
            [pagamento.matricula_id]
          );
          
          if (matriculaResult.rows.length > 0) {
            const matricula = matriculaResult.rows[0];
            
            // Atualizar status da matrícula
            if (status === 'pago') {
              await query(
                'UPDATE matriculas SET status = $1 WHERE id = $2',
                ['ativo', pagamento.matricula_id]
              );
              
              // Criar notificação para o estudante
              await query(
                `INSERT INTO notificacoes (
                  usuario_id, tipo, titulo, mensagem, link, created_at
                ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [
                  matricula.estudante_id,
                  'pagamento',
                  'Pagamento Aprovado',
                  `Seu pagamento para o curso "${matricula.curso_titulo}" foi aprovado com sucesso!`,
                  '/student/meus-pagamentos'
                ]
              );
              
            } else if (status === 'rejeitado') {
              await query(
                'UPDATE matriculas SET status = $1 WHERE id = $2',
                ['pagamento_rejeitado', pagamento.matricula_id]
              );
              
              // Criar notificação para o estudante
              await query(
                `INSERT INTO notificacoes (
                  usuario_id, tipo, titulo, mensagem, link, created_at
                ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [
                  matricula.estudante_id,
                  'pagamento',
                  'Pagamento Rejeitado',
                  `Seu pagamento para o curso "${matricula.curso_titulo}" foi rejeitado. Verifique o comprovante.`,
                  '/student/meus-pagamentos'
                ]
              );
            }
          }
          
          res.status(200).json({
            success: true,
            message: 'Status atualizado com sucesso',
            data: { 
              id, 
              status,
              status_antigo: statusAntigo,
              atualizado_por: user.nome
            }
          });
          
        } catch (error) {
          console.error('❌ Erro ao atualizar status:', error);
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
          allowed: ['PUT']
        });
    }
  } catch (error) {
    console.error('❌ Erro na API de status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);