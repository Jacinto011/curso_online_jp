import withCors from '../../../lib/cors';
import { hashPassword } from '../../../lib/database-postgres';
import { query } from '../../../lib/database-postgres';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido',
      allowed: ['POST']
    });
  }

  try {
    const { nome, email, senha, telefone, bio, role, dados_bancarios } = req.body;

    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, email, senha e telefone são obrigatórios' 
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'A senha deve ter no mínimo 6 caracteres' 
      });
    }

    if (role === 'instructor' && (!dados_bancarios || Object.keys(dados_bancarios).length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Instrutores devem fornecer dados bancários' 
      });
    }

    const usuarioExistente = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já cadastrado' 
      });
    }

    const hashedPassword = await hashPassword(senha);
    const pool = await require('../../../lib/database-postgres').getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO usuarios (nome, email, senha, telefone, bio, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nome, email, role`,
        [nome, email, hashedPassword, telefone, bio || null, role || 'student']
      );

      const usuarioId = result.rows[0].id;

      if (role === 'instructor' && dados_bancarios) {
        await client.query(
          `INSERT INTO dados_bancarios_instrutor 
           (instrutor_id, banco_nome, banco_codigo, agencia, conta, nib, tipo_conta, 
            nome_titular, telefone_titular, mpesa_numero, emola_numero, airtel_money_numero)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            usuarioId,
            dados_bancarios.banco_nome || null,
            dados_bancarios.banco_codigo || null,
            dados_bancarios.agencia || null,
            dados_bancarios.conta || null,
            dados_bancarios.nib || null,
            dados_bancarios.tipo_conta || 'corrente',
            dados_bancarios.nome_titular || null,
            dados_bancarios.telefone_titular || null,
            dados_bancarios.mpesa_numero || null,
            dados_bancarios.emola_numero || null,
            dados_bancarios.airtel_money_numero || null
          ]
        );

        await client.query(
          `INSERT INTO pedidos_instrutor (usuario_id, mensagem, status)
           VALUES ($1, $2, $3)`,
          [usuarioId, 'Novo instrutor registrado. Aguardando aprovação.', 'pendente']
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: role === 'instructor' 
          ? 'Conta criada com sucesso! Aguarde aprovação do administrador.' 
          : 'Conta criada com sucesso!',
        usuario: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);