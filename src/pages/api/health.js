// pages/api/health.js - PARA TESTE
import withCors from '../../lib/cors';

async function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent'],
  });
}

export default withCors(handler);