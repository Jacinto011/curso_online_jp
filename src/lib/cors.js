// lib/cors.js - APENAS PARA DESENVOLVIMENTO
export default function withCors(handler) {
  return async (req, res) => {
    // SÓ aplica CORS em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
    }
    
    return handler(req, res);
  };
}