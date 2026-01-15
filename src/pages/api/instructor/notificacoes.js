import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    switch (req.method) {
      case 'GET':
        try {
          const { lidas = false } = req.query;
          
          let sql = `
            SELECT * FROM notificacoes 
            WHERE usuario_id = $1
          `;
          
          const params = [user.id];
          
          if (lidas === 'true') {
            sql += ' AND lida = true';
          } else if (lidas === 'false') {
            sql += ' AND lida = false';
          }
          
          sql += ' ORDER BY data_criacao DESC LIMIT 50';
          
          const result = await query(sql, params);

          res.status(200).json({
            success: true,
            data: result.rows
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
          const { notificacao_id, lida } = req.body;
          
          if (!notificacao_id || typeof lida !== 'boolean') {
            return res.status(400).json({ 
              success: false,
              message: 'ID da notificação e status lida são obrigatórios' 
            });
          }

          // Verificar se a notificação pertence ao usuário
          const notificacaoResult = await query(
            'SELECT id FROM notificacoes WHERE id = $1 AND usuario_id = $2',
            [notificacao_id, user.id]
          );
          
          if (notificacaoResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Notificação não encontrada' 
            });
          }

          await query(
            'UPDATE notificacoes SET lida = $1 WHERE id = $2',
            [lida, notificacao_id]
          );

          res.status(200).json({ 
            success: true, 
            message: `Notificação ${lida ? 'marcada como lida' : 'marcada como não lida'}` 
          });
          
        } catch (error) {
          console.error('Erro ao atualizar notificação:', error);
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
          allowed: ['GET', 'PUT']
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