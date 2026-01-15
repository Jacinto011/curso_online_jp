import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['GET']
    });
  }

  try {
    const user = await authenticate(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    // Buscar dados do usuário
    const usuarioResult = await query(
      'SELECT id, nome, email, telefone, bio, role, data_criacao, avatar_url FROM usuarios WHERE id = $1',
      [user.id]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }

    const usuario = usuarioResult.rows[0];

    // Se for instrutor, buscar dados bancários
    let dadosBancarios = null;
    if (user.role === 'instructor') {
      const dadosBancariosResult = await query(
        'SELECT * FROM dados_bancarios_instrutor WHERE instrutor_id = $1 AND ativo = true',
        [user.id]
      );
      
      if (dadosBancariosResult.rows.length > 0) {
        dadosBancarios = dadosBancariosResult.rows[0];
      }
    }

    res.status(200).json({
      success: true,
      data: {
        usuario,
        dados_bancarios: dadosBancarios
      }
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);