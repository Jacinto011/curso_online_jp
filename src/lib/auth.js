// lib/auth.js - ATUALIZADO PARA POSTGRESQL
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./database-postgres');

const JWT_SECRET = process.env.JWT_SECRET || 'curso_online_segredo_jwt_2025_muito_forte_123456789';
const JWT_EXPIRES_IN = '7d';

// Gerar token JWT
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    nome: user.nome
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

// Verificar token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Autenticar usuário (para PostgreSQL)
async function authenticateUser(email, password) {
  try {
    // Buscar usuário
    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.senha);
    
    if (!isValid) {
      throw new Error('Senha incorreta');
    }

    // Remover senha do objeto de retorno
    const { senha, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
}

// Middleware para verificar token
async function authenticate(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    // Buscar usuário no banco para garantir que ainda existe
    const result = await query(
      'SELECT id, nome, email, role, ativo FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.id]
    );

    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

// Middleware para proteger rotas
function protectRoute(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token não fornecido' 
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
  }

  req.user = decoded;
  next();
}

// Verificar role específica
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso não autorizado' 
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticate,
  protectRoute,
  authorizeRole,
  JWT_SECRET
};


