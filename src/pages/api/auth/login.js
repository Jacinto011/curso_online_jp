import withCors from '../../../lib/cors';
import { authenticateUser, generateToken } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido',
      allowed: ['POST']
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }

    const user = await authenticateUser(email, password);
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        telefone: user.telefone,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error.message === 'Usuário não encontrado' || error.message === 'Senha incorreta') {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

export default withCors(handler);