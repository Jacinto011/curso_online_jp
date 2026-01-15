import withCors from '../../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['POST']
    });
  }

  try {
    // Limpar token/cookie
    res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    
    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

export default withCors(handler);