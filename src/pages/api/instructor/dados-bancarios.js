import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    switch (req.method) {
      case 'GET':
        try {
          const result = await query(`
            SELECT * FROM dados_bancarios_instrutor 
            WHERE instrutor_id = $1
          `, [user.id]);

          res.status(200).json({
            success: true,
            data: result.rows[0] || null
          });
          
        } catch (error) {
          console.error('Erro ao buscar dados bancários:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      case 'PUT':
        try {
          const {
            banco_nome,
            banco_codigo,
            agencia,
            conta,
            nib,
            tipo_conta,
            nome_titular,
            telefone_titular,
            mpesa_numero,
            emola_numero,
            airtel_money_numero
          } = req.body;

          // Verificar se já existe registro
          const existeResult = await query(
            'SELECT id FROM dados_bancarios_instrutor WHERE instrutor_id = $1',
            [user.id]
          );

          if (existeResult.rows.length > 0) {
            // Atualizar
            await query(
              `UPDATE dados_bancarios_instrutor 
               SET banco_nome = $1, banco_codigo = $2, agencia = $3, conta = $4, nib = $5,
                   tipo_conta = $6, nome_titular = $7, telefone_titular = $8,
                   mpesa_numero = $9, emola_numero = $10, airtel_money_numero = $11
               WHERE instrutor_id = $12`,
              [
                banco_nome || null,
                banco_codigo || null,
                agencia || null,
                conta || null,
                nib || null,
                tipo_conta || 'corrente',
                nome_titular || null,
                telefone_titular || null,
                mpesa_numero || null,
                emola_numero || null,
                airtel_money_numero || null,
                user.id
              ]
            );
          } else {
            // Inserir novo
            await query(
              `INSERT INTO dados_bancarios_instrutor 
               (instrutor_id, banco_nome, banco_codigo, agencia, conta, nib, tipo_conta,
                nome_titular, telefone_titular, mpesa_numero, emola_numero, airtel_money_numero)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                user.id,
                banco_nome || null,
                banco_codigo || null,
                agencia || null,
                conta || null,
                nib || null,
                tipo_conta || 'corrente',
                nome_titular || null,
                telefone_titular || null,
                mpesa_numero || null,
                emola_numero || null,
                airtel_money_numero || null
              ]
            );
          }

          res.status(200).json({
            success: true,
            message: 'Dados bancários atualizados com sucesso'
          });
          
        } catch (error) {
          console.error('Erro ao atualizar dados bancários:', error);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;

      default:
        return res.status(405).json({ 
          success: false,
          message: 'Método não permitido',
          allowed: ['GET', 'PUT']
        });
    }
  } catch (error) {
    console.error('Erro na API de dados bancários:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);