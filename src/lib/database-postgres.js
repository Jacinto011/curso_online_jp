const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;
let isInitializing = false;

// Inicialização do banco de dados
async function initializeDatabase() {
  if (pool) return pool;
  
  // Evitar múltiplas inicializações simultâneas
  if (isInitializing) {
    // Espera até que a inicialização esteja completa
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (pool) {
          clearInterval(checkInterval);
          resolve(pool);
        }
      }, 100);
    });
  }
  
  isInitializing = true;
  
  console.log('🔗 Inicializando conexão PostgreSQL com Neon...');

  // Usar DATABASE_URL do .env ou fallback para teste
  const connectionString = process.env.DATABASE_URL || 
    "postgresql://neondb_owner:npg_ngokUIehT0m5@ep-still-flower-ag6ifhlb-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  try {
    // Testar conexão (query simples)
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL Neon com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    console.log('💡 Verifique se:');
    console.log('1. DATABASE_URL está configurada no .env.local');
    console.log('2. A URL está correta');
    console.log('3. O banco existe no Neon.tech');
    
    // Resetar pool em caso de erro
    pool = null;
    isInitializing = false;
    throw error;
  }
  
  isInitializing = false;
  return pool;
}

// Função para garantir que o pool está inicializado
async function ensurePool() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
}

// Função query atualizada para garantir inicialização
async function query(text, params) {
  const clientPool = await ensurePool();
  try {
    return await clientPool.query(text, params);
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    throw error;
  }
}

// Função para obter cliente com conexão dedicada
async function getClient() {
  const clientPool = await ensurePool();
  return clientPool.connect();
}

// Funções existentes (mantenha todas as suas funções de criação de tabelas)
async function criarTabelas() {
  const client = await getClient();
  // ... resto do código igual ...
}

async function inserirDadosIniciais() {
  // ... resto do código igual ...
}

async function inserirMetodosPagamento() {
  // ... resto do código igual ...
}

async function executarMigracaoCompleta() {
  console.log('🚀 Executando migração completa...');
  await initializeDatabase();
  await criarTabelas();
  await inserirDadosIniciais();
  console.log('🎉 Migração completa concluída!');
}

// Funções auxiliares
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Obter pool (com inicialização garantida)
async function getPool() {
  await ensurePool();
  return pool;
}

module.exports = { 
  initializeDatabase,
  executarMigracaoCompleta,
  query,
  getClient,  // Nova função para obter cliente
  hashPassword,
  comparePassword,
  getPool
};