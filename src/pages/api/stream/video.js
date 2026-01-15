import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path não fornecido' });
  }

  try {
    // Verificar se é um vídeo do Supabase
    if (path.includes('supabase.co')) {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error('Vídeo não encontrado');
      }

      // Configurar headers para streaming
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      // Pipe do stream
      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }

      res.end();
    } else {
      // Para Cloudinary ou outros providers, redirecionar
      res.redirect(307, path);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Erro ao carregar vídeo' });
  }
}