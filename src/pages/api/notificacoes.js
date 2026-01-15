import withCors from '../../lib/cors';
import { query } from '../../lib/database-postgres';
import { authenticate } from '../../lib/auth';

// Função auxiliar para criar notificações
export async function criarNotificacao(usuarioId, tipo, titulo, mensagem, link = null) {
  try {
    const result = await query(
      `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, data_criacao)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [usuarioId, tipo, titulo, mensagem, link]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

// Criar notificação para múltiplos usuários
export async function criarNotificacaoMultipla(usuariosIds, tipo, titulo, mensagem, link = null) {
  try {
    const promises = usuariosIds.map(usuarioId =>
      criarNotificacao(usuarioId, tipo, titulo, mensagem, link)
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao criar notificações múltiplas:', error);
    return [];
  }
}

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
      case 'GET':
        try {
          const { limite = 20, offset = 0, apenas_nao_lidas = false } = req.query;
          
          let sql = `
            SELECT * FROM notificacoes 
            WHERE usuario_id = $1
          `;
          
          const params = [user.id];
          
          if (apenas_nao_lidas === 'true') {
            sql += ' AND lida = false';
          }
          
          sql += ' ORDER BY data_criacao DESC LIMIT $2 OFFSET $3';
          params.push(parseInt(limite), parseInt(offset));
          
          const result = await query(sql, params);
          
          // Contar não lidas
          const totalNaoLidasResult = await query(
            'SELECT COUNT(*) as count FROM notificacoes WHERE usuario_id = $1 AND lida = false',
            [user.id]
          );
          
          res.status(200).json({
            success: true,
            data: {
              notificacoes: result.rows,
              total_nao_lidas: parseInt(totalNaoLidasResult.rows[0].count),
              total: result.rows.length
            }
          });
          
        } catch (error) {
          console.error('Erro ao buscar notificações:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'PUT':
        try {
          const { notificacao_id, marcar_todas, acao } = req.body;
          
          if (marcar_todas === true) {
            // Marcar todas como lidas
            await query(
              `UPDATE notificacoes 
               SET lida = true, data_leitura = CURRENT_TIMESTAMP
               WHERE usuario_id = $1 AND lida = false`,
              [user.id]
            );
            
            res.status(200).json({ 
              success: true, 
              message: 'Todas as notificações marcadas como lidas' 
            });
            
          } else if (notificacao_id) {
            if (acao === 'ler') {
              // Marcar como lida
              await query(
                `UPDATE notificacoes 
                 SET lida = true, data_leitura = CURRENT_TIMESTAMP
                 WHERE id = $1 AND usuario_id = $2`,
                [notificacao_id, user.id]
              );
              
              res.status(200).json({ 
                success: true, 
                message: 'Notificação marcada como lida' 
              });
            } else if (acao === 'excluir') {
              // Excluir notificação
              await query(
                'DELETE FROM notificacoes WHERE id = $1 AND usuario_id = $2',
                [notificacao_id, user.id]
              );
              
              res.status(200).json({ 
                success: true, 
                message: 'Notificação excluída' 
              });
            } else {
              res.status(400).json({ 
                success: false,
                message: 'Ação inválida' 
              });
            }
          } else {
            res.status(400).json({ 
              success: false,
              message: 'ID da notificação é obrigatório' 
            });
          }
          
        } catch (error) {
          console.error('Erro ao atualizar notificações:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'POST':
        try {
          const { usuario_id, tipo, titulo, mensagem, link } = req.body;
          
          // Apenas admin pode criar notificações para outros
          if (usuario_id && usuario_id !== user.id) {
            const isAdmin = user.role === 'admin';
            if (!isAdmin) {
              return res.status(403).json({ 
                success: false,
                message: 'Apenas administradores podem criar notificações para outros usuários' 
              });
            }
          }
          
          const targetUserId = usuario_id || user.id;
          const notificacaoId = await criarNotificacao(
            targetUserId, 
            tipo, 
            titulo, 
            mensagem, 
            link
          );
          
          if (notificacaoId) {
            res.status(201).json({ 
              success: true, 
              message: 'Notificação criada',
              notificacao_id: notificacaoId 
            });
          } else {
            res.status(500).json({ 
              success: false,
              message: 'Erro ao criar notificação' 
            });
          }
          
        } catch (error) {
          console.error('Erro ao criar notificação:', error);
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
          allowed: ['GET', 'PUT', 'POST']
        });
    }
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);