#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { executarMigracaoCompleta } = require('../lib/database-postgres');

console.log(`
╔══════════════════════════════════════════════════════╗
║         MIGRAÇÃO DE BANCO DE DADOS - NEON.TECH       ║
╚══════════════════════════════════════════════════════╝
`);

async function main() {
  try {
    console.log('🔍 Verificando configuração...');
    
    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERRO: DATABASE_URL não encontrada!');
      console.log('\n📝 CONFIGURE NO ARQUIVO .env.local:');
      console.log('DATABASE_URL="postgresql://neondb_owner:SUA_SENHA@ep-still-flower-ag6ifhlb-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"');
      console.log('JWT_SECRET="seu_segredo_jwt_aqui"');
      console.log('\n💡 Dica: Use a mesma URL do seu teste anterior.');
      process.exit(1);
    }

    console.log('✅ DATABASE_URL configurada');
    console.log('🔗 Iniciando migração...\n');

    // Executar migração
    await executarMigracaoCompleta();

    console.log('\n══════════════════════════════════════════════════════');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('══════════════════════════════════════════════════════\n');
    
    console.log('📋 RESUMO:');
    console.log('• Banco de dados: Neon PostgreSQL');
    console.log('• Região: Europa Central (eu-central-1)');
    console.log('• Tabelas criadas: 16 tabelas principais');
    console.log('• Usuários iniciais: Admin, Instrutor, Estudante');
    console.log('• Métodos de pagamento: 8 configurados');
    
    console.log('\n🔑 CREDENCIAIS DE TESTE:');
    console.log('┌─────────────────┬─────────────────────────────┐');
    console.log('│ Email           │ Senha                       │');
    console.log('├─────────────────┼─────────────────────────────┤');
    console.log('│ admin@curso.com │ admin123                    │');
    console.log('│ instrutor@curso │ instrutor123                │');
    console.log('│ estudante@curso │ estudante123                │');
    console.log('└─────────────────┴─────────────────────────────┘');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Inicie o servidor: npm run dev');
    console.log('2. Acesse: http://localhost:3000');
    console.log('3. Faça login com uma das credenciais acima');
    console.log('4. Configure seu frontend para usar as APIs');
    
    console.log('\n📊 MONITORAMENTO:');
    console.log('• Acesse: https://console.neon.tech');
    console.log('• Verifique uso e estatísticas');
    console.log('• Configure alertas se necessário');
    
    console.log('\n✅ Pronto para produção!');

  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n🔐 Erro de autenticação: Senha incorreta');
      console.log('Solução: Verifique a senha na URL do Neon');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🌐 Servidor não encontrado');
      console.log('Solução: Verifique o domínio na DATABASE_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🚫 Conexão recusada');
      console.log('Solução: Verifique se o banco está ativo no Neon');
    } else if (error.message.includes('relation')) {
      console.error('\n📊 Erro de tabela já existente');
      console.log('Isso é normal se já rodou a migração antes.');
      console.log('As tabelas já existem no banco.');
    }
    
    console.error('\n🔍 Detalhe técnico:', error.code || error.message);
    process.exit(1);
  }
}

// Executar
main();