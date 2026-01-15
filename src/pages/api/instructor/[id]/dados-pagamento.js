import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do instrutor é obrigatório' 
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    // Verificar se o instrutor existe
    const instrutorResult = await query(`
      SELECT id, nome, email, telefone, role, ativo 
      FROM usuarios 
      WHERE id = $1 AND role = 'instructor'
    `, [id]);

    if (instrutorResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Instrutor não encontrado' 
      });
    }

    const instrutor = instrutorResult.rows[0];

    // Buscar dados bancários do instrutor
    const dadosBancariosResult = await query(`
      SELECT * FROM dados_bancarios_instrutor 
      WHERE instrutor_id = $1 AND ativo = true
    `, [id]);

    let responseData;
    
    if (dadosBancariosResult.rows.length === 0) {
      // Dados padrão
      responseData = {
        instrutor_id: instrutor.id,
        nome_titular: instrutor.nome,
        email: instrutor.email,
        telefone_titular: instrutor.telefone || '',
        banco_nome: 'Entre em contato com o instrutor',
        banco_codigo: '',
        agencia: '',
        conta: '',
        nib: '',
        tipo_conta: '',
        mpesa_numero: instrutor.telefone || '',
        emola_numero: instrutor.telefone || '',
        airtel_money_numero: instrutor.telefone || '',
        data_cadastro: new Date().toISOString(),
        ativo: true
      };
    } else {
      // Dados do banco
      const dadosBancarios = dadosBancariosResult.rows[0];
      responseData = {
        ...dadosBancarios,
        instrutor_nome: instrutor.nome,
        instrutor_email: instrutor.email,
        instrutor_telefone: instrutor.telefone
      };
    }

    return res.status(200).json({
      success: true,
      dados_padrao: dadosBancariosResult.rows.length === 0,
      data: responseData
    });

  } catch (error) {
    console.error('Erro detalhado ao buscar dados de pagamento:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);