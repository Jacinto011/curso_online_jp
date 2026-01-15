require('dotenv').config();
const { Pool } = require('pg');

console.log('🧪 Testando conexão com Neon.tech...\n');

async function testConnection() {
  // Usar a URL diretamente (substitua com a SUA)
  const connectionString = "postgresql://neondb_owner:npg_ngokUIehT0m5@ep-still-flower-ag6ifhlb-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  
  console.log('🔗 URL usada:', connectionString.substring(0, 60) + '...');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Tentando conectar...');
    const client = await pool.connect();
    
    // Teste 1: Hora do servidor
    const timeResult = await client.query('SELECT NOW() as hora_servidor');
    console.log('✅ Conectado com SUCESSO!');
    console.log('🕒 Hora do servidor Neon:', timeResult.rows[0].hora_servidor);
    
    // Teste 2: Versão do PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log('🔧 Versão:', versionResult.rows[0].version.split(',')[0]);
    
    // Teste 3: Criar tabela de teste
    console.log('\n📝 Criando tabela de teste...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS teste_conexao (
        id SERIAL PRIMARY KEY,
        mensagem TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Inserir dados de teste
    await client.query(
      'INSERT INTO teste_conexao (mensagem) VALUES ($1)',
      ['✅ Conexão Neon funcionando perfeitamente!']
    );
    
    // Verificar inserção
    const dadosResult = await client.query('SELECT * FROM teste_conexao');
    console.log('📊 Dados inseridos:', dadosResult.rows[0]);
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 TUDO FUNCIONANDO! Seu Neon está pronto!');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Código do erro:', error.code);
    
    if (error.code === '28P01') {
      console.log('\n💡 Problema: Senha incorreta ou usuário não existe');
      console.log('Solução: Verifique se a senha está correta no Neon dashboard');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Problema: Servidor não encontrado');
      console.log('Solução: Verifique se o domínio está correto');
    }
    
    await pool.end();
  }
}

testConnection();