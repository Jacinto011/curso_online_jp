import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    const result = await query(`
      SELECT 
        p.*,
        p.codigo_transacao,
        p.valor,
        p.status,
        p.data_pagamento,
        p.comprovante_url,
        c.titulo as curso_titulo,
        c.imagem_url as curso_imagem,
        u.nome as instrutor_nome,
        mp.nome as metodo_pagamento_nome,
        h.data_registro as ultima_atualizacao
      FROM pagamentos p
      JOIN matriculas m ON p.matricula_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON c.instrutor_id = u.id
      LEFT JOIN metodos_pagamento mp ON p.metodo_pagamento_id = mp.id
      LEFT JOIN (
        SELECT pagamento_id, MAX(data_registro) as data_registro 
        FROM historico_pagamento 
        GROUP BY pagamento_id
      ) h ON p.id = h.pagamento_id
      WHERE m.estudante_id = $1
      ORDER BY p.data_pagamento DESC
    `, [user.id]);

    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao buscar pagamentos do estudante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);