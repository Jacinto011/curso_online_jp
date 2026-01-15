const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

let db = null;

// Inicialização do banco de dados
async function initializeDatabase() {
  if (db) return db;

  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Criar tabelas
  await db.exec(`
    -- Tabela de usuários
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'instructor', 'student')),
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ativo BOOLEAN DEFAULT 1,
      telefone TEXT,
      bio TEXT,
      avatar_url TEXT
    );

    -- Tabela de cursos
    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      instrutor_id INTEGER NOT NULL,
      preco DECIMAL(10,2) DEFAULT 0,
      gratuito BOOLEAN DEFAULT 0,
      duracao_estimada INTEGER,
      imagem_url TEXT,
      categoria TEXT,
      nivel TEXT CHECK(nivel IN ('iniciante', 'intermediario', 'avancado')),
      status TEXT DEFAULT 'rascunho' CHECK(status IN ('rascunho', 'publicado', 'arquivado')),
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instrutor_id) REFERENCES usuarios(id)
    );

    -- Tabela de módulos
    CREATE TABLE IF NOT EXISTS modulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curso_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      ordem INTEGER NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (curso_id) REFERENCES cursos(id)
    );

    -- Tabela de materiais
    CREATE TABLE IF NOT EXISTS materiais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modulo_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('video', 'documento', 'link', 'texto')),
      conteudo TEXT,
      url TEXT,
      duracao INTEGER,
      ordem INTEGER NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (modulo_id) REFERENCES modulos(id)
    );

    -- Tabela de quizzes
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modulo_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      pontuacao_minima INTEGER DEFAULT 70,
      tempo_limite INTEGER,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (modulo_id) REFERENCES modulos(id)
    );

    -- Tabela de perguntas
    CREATE TABLE IF NOT EXISTS perguntas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      enunciado TEXT NOT NULL,
      tipo TEXT DEFAULT 'multipla_escolha' CHECK(tipo IN ('multipla_escolha', 'verdadeiro_falso')),
      pontos INTEGER DEFAULT 1,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    );

    -- Tabela de opções de resposta
    CREATE TABLE IF NOT EXISTS opcoes_resposta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pergunta_id INTEGER NOT NULL,
      texto TEXT NOT NULL,
      correta BOOLEAN DEFAULT 0,
      FOREIGN KEY (pergunta_id) REFERENCES perguntas(id)
    );

    -- Tabela de matrículas
    CREATE TABLE IF NOT EXISTS matriculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudante_id INTEGER NOT NULL,
      curso_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'ativa', 'concluida', 'suspensa')),
      data_matricula DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_conclusao DATETIME,
      pagamento_confirmado BOOLEAN DEFAULT 0,
      instrutor_confirmado BOOLEAN DEFAULT 0,
      FOREIGN KEY (estudante_id) REFERENCES usuarios(id),
      FOREIGN KEY (curso_id) REFERENCES cursos(id),
      UNIQUE(estudante_id, curso_id)
    );

    -- Tabela de progresso
    CREATE TABLE IF NOT EXISTS progresso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER NOT NULL,
      modulo_id INTEGER NOT NULL,
      material_id INTEGER,
      concluido BOOLEAN DEFAULT 0,
      data_conclusao DATETIME,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
      FOREIGN KEY (modulo_id) REFERENCES modulos(id),
      FOREIGN KEY (material_id) REFERENCES materiais(id)
    );

    -- Tabela de resultados de quiz
    CREATE TABLE IF NOT EXISTS resultados_quiz (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      pontuacao INTEGER NOT NULL,
      aprovado BOOLEAN DEFAULT 0,
      data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    );

    -- Tabela de certificados
    CREATE TABLE IF NOT EXISTS certificados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER NOT NULL,
      codigo_verificacao TEXT UNIQUE NOT NULL,
      url_pdf TEXT,
      data_emissao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id)
    );

    -- Tabela de pedidos para ser instrutor
    CREATE TABLE IF NOT EXISTS pedidos_instrutor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      mensagem TEXT,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovado', 'rejeitado')),
      data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_avaliacao DATETIME,
      avaliador_id INTEGER,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (avaliador_id) REFERENCES usuarios(id)
    )
  `);

  // Criar tabelas de pagamento em execuções separadas
  await db.exec(`
    -- Tabela de dados bancários dos instrutores
    CREATE TABLE IF NOT EXISTS dados_bancarios_instrutor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrutor_id INTEGER NOT NULL,
      banco_nome TEXT,
      banco_codigo TEXT,
      agencia TEXT,
      conta TEXT,
      nib TEXT,
      tipo_conta TEXT CHECK(tipo_conta IN ('poupanca', 'corrente')),
      nome_titular TEXT,
      telefone_titular TEXT,
      mpesa_numero TEXT,
      emola_numero TEXT,
      airtel_money_numero TEXT,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      ativo BOOLEAN DEFAULT 1,
      FOREIGN KEY (instrutor_id) REFERENCES usuarios(id),
      UNIQUE(instrutor_id)
    )
  `);

  await db.exec(`
    -- Tabela de métodos de pagamento do sistema
    CREATE TABLE IF NOT EXISTS metodos_pagamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('banco', 'carteira_digital')),
      descricao TEXT,
      instrucoes TEXT,
      ativo BOOLEAN DEFAULT 1,
      icon_name TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    -- Tabela de pagamentos
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula_id INTEGER NOT NULL,
      metodo_pagamento_id INTEGER,
      valor DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'processando', 'pago', 'rejeitado', 'cancelado')),
      comprovante_url TEXT,
      codigo_transacao TEXT,
      data_pagamento DATETIME,
      data_confirmacao DATETIME,
      observacoes TEXT,
      FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
      FOREIGN KEY (metodo_pagamento_id) REFERENCES metodos_pagamento(id)
    )
  `);

  await db.exec(`
    -- Tabela de histórico de status de pagamento
    CREATE TABLE IF NOT EXISTS historico_pagamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pagamento_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      observacoes TEXT,
      usuario_id INTEGER,
      data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagamento_id) REFERENCES pagamentos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  await db.exec(`
    -- Tabela de notificações
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      lida BOOLEAN DEFAULT 0,
      link TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_leitura DATETIME,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Inserir métodos de pagamento
  await inserirMetodosPagamento(db);

  // Inserir admin padrão se não existir
  const adminExists = await db.get('SELECT id FROM usuarios WHERE role = "admin" LIMIT 1');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
      ['Administrador', 'admin@curso.com', hashedPassword, 'admin']
    );
    console.log('Admin padrão criado: admin@curso.com / admin123');
  }

  // Inserir instrutor de exemplo
  const instructorExists = await db.get('SELECT id FROM usuarios WHERE role = "instructor" LIMIT 1');
  if (!instructorExists) {
    const hashedPassword = await bcrypt.hash('instrutor123', 10);
    await db.run(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
      ['Instrutor Exemplo', 'instrutor@curso.com', hashedPassword, 'instructor']
    );
  }

  // Inserir estudante de exemplo
  const studentExists = await db.get('SELECT id FROM usuarios WHERE role = "student" LIMIT 1');
  if (!studentExists) {
    const hashedPassword = await bcrypt.hash('estudante123', 10);
    await db.run(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
      ['Estudante Exemplo', 'estudante@curso.com', hashedPassword, 'student']
    );
  }

  return db;
}

// Função para inserir métodos de pagamento
async function inserirMetodosPagamento(db) {
  const metodos = [
    // Bancos
    ['Banco BCI', 'bci', 'banco', 'Banco Comercial e de Investimentos', 'Faça transferência para a conta abaixo', 'bi-bank'],
    ['Standard Bank', 'standard', 'banco', 'Standard Bank Moçambique', 'Faça transferência para a conta abaixo', 'bi-bank'],
    ['Millennium BIM', 'bim', 'banco', 'Banco Internacional de Moçambique', 'Faça transferência para a conta abaixo', 'bi-bank'],
    ['Absa Bank', 'absa', 'banco', 'Absa Bank Moçambique', 'Faça transferência para a conta abaixo', 'bi-bank'],
    ['Ecobank', 'ecobank', 'banco', 'Ecobank Moçambique', 'Faça transferência para a conta abaixo', 'bi-bank'],
    // Carteiras digitais
    ['M-Pesa', 'mpesa', 'carteira_digital', 'Pagamento via M-Pesa', 'Use o número M-Pesa do instrutor', 'bi-phone'],
    ['e-Mola', 'emola', 'carteira_digital', 'Pagamento via e-Mola', 'Use o número e-Mola do instrutor', 'bi-wallet2'],
    ['Airtel Money', 'airtel_money', 'carteira_digital', 'Pagamento via Airtel Money', 'Use o número Airtel Money do instrutor', 'bi-phone']
  ];

  for (const metodo of metodos) {
    const existe = await db.get('SELECT id FROM metodos_pagamento WHERE codigo = ?', [metodo[1]]);
    if (!existe) {
      await db.run(
        'INSERT INTO metodos_pagamento (nome, codigo, tipo, descricao, instrucoes, icon_name) VALUES (?, ?, ?, ?, ?, ?)',
        metodo
      );
    }
  }
}

// Funções auxiliares
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { 
  initializeDatabase,
  getDb: () => db,
  hashPassword,
  comparePassword
};