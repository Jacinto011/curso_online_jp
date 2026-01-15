import withCors from '../../../lib/cors';
import { hashPassword } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['PUT']
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

    const { senha_atual, nova_senha } = req.body;

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha atual e nova senha são obrigatórias' 
      });
    }

    if (nova_senha.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha deve ter no mínimo 6 caracteres' 
      });
    }

    const usuarioResult = await query(
      'SELECT senha FROM usuarios WHERE id = $1', 
      [user.id]
    );
    
    const usuario = usuarioResult.rows[0];
    
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    const bcrypt = require('bcryptjs');
    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
    
    if (!senhaValida) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha atual incorreta' 
      });
    }

    const hashedPassword = await hashPassword(nova_senha);

    await query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

export default withCors(handler);