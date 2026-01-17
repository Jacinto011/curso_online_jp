// api/admin/configuracoes.js - VERSÃO CORRIGIDA COMPLETA
import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

// Configurações padrão com MZN (Moçambique)
const DEFAULT_CONFIG = {
  nome_plataforma: 'Plataforma de Cursos Online',
  email_suporte: 'suporte@curso.com',
  url_plataforma: 'http://localhost:3000',
  manutencao: false,
  novos_cursos_aprovacao: false,
  limite_matriculas: 100,
  tempo_sessao: 24,
  moeda_padrao: 'MZN',
  moeda_simbolo: 'MT',
  moeda_formato: '1 234,56 MT',
  taxa_inscricao: 0,
  comissao_instrutor: 70,
  imposto_vat: 16,
  email_host: 'smtp.gmail.com',
  email_port: 587,
  email_secure: false,
  email_user: '',
  email_pass: '',
  cor_primaria: '#007bff',
  cor_secundaria: '#6c757d',
  cor_sucesso: '#28a745',
  cor_perigo: '#dc3545',
  cor_aviso: '#ffc107',
  cor_info: '#17a2b8',
  analytics_id: '',
  logo_url: '',
  favicon_url: '',
  termos_uso: 'Termos de uso da plataforma...',
  politica_privacidade: 'Política de privacidade...'
};

// Funções auxiliares
const valorParaString = (valor) => {
  if (typeof valor === 'boolean') return valor ? 'true' : 'false';
  if (typeof valor === 'number') return valor.toString();
  return String(valor || '');
};

const determinarTipo = (valor) => {
  if (typeof valor === 'boolean') return 'boolean';
  if (typeof valor === 'number') return 'number';
  return 'text';
};

const formatarMoedaMZN = (valor) => {
  const valorNum = parseFloat(valor);
  if (isNaN(valorNum)) return '0,00 MT';
  
  const partes = valorNum.toFixed(2).split('.');
  let parteInteira = partes[0];
  const parteDecimal = partes[1];
  parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parteInteira},${parteDecimal} MT`;
};

async function handler(req, res) {
  // Autenticação ADMIN
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ 
      success: false,
      message: 'Não autorizado. Apenas administradores.' 
    });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Buscar configurações do banco
        const result = await query(`
          SELECT chave, valor, tipo, categoria, descricao 
          FROM configuracoes_sistema 
          ORDER BY categoria, chave
        `);
        
        // Converter para objeto
        const configuracoes = {};
        result.rows.forEach(row => {
          switch (row.tipo) {
            case 'boolean':
              configuracoes[row.chave] = row.valor === 'true';
              break;
            case 'number':
              configuracoes[row.chave] = parseFloat(row.valor) || 0;
              break;
            default:
              configuracoes[row.chave] = row.valor;
          }
        });
        
        // Mesclar com padrões
        const configuracoesCompletas = { ...DEFAULT_CONFIG, ...configuracoes };
        
        res.status(200).json({
          success: true,
          data: configuracoesCompletas,
          formatos: {
            moeda: {
              exemplo: formatarMoedaMZN(1234.56)
            }
          }
        });
        
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(200).json({
          success: true,
          data: DEFAULT_CONFIG,
          warning: 'Usando configurações padrão'
        });
      }
      break;

    case 'PUT':
      try {
        const configuracoes = req.body;
        
        console.log('Salvando configurações...');
        
        // Atualizar cada configuração individualmente SEM transação
        const resultados = [];
        const atualizadas = [];
        
        for (const [chave, valor] of Object.entries(configuracoes)) {
          try {
            // Pular chaves que não estão nas configurações padrão
            if (!DEFAULT_CONFIG.hasOwnProperty(chave)) {
              console.warn(`Chave ignorada: ${chave}`);
              continue;
            }
            
            const valorString = valorParaString(valor);
            const tipo = determinarTipo(valor);
            
            await query(`
              INSERT INTO configuracoes_sistema (chave, valor, tipo) 
              VALUES ($1, $2, $3)
              ON CONFLICT (chave) 
              DO UPDATE SET 
                valor = EXCLUDED.valor,
                tipo = EXCLUDED.tipo,
                updated_at = CURRENT_TIMESTAMP
            `, [chave, valorString, tipo]);
            
            resultados.push({ chave, success: true });
            atualizadas.push(chave);
            
            console.log(`✅ Configuração "${chave}" salva: ${valorString}`);
          } catch (error) {
            console.error(`❌ Erro ao salvar chave ${chave}:`, error.message);
            resultados.push({ chave, success: false, error: error.message });
          }
        }
        
        // Registrar log
        try {
          await query(`
            INSERT INTO logs_sistema 
              (usuario_id, acao, modulo, descricao)
            VALUES ($1, $2, $3, $4)
          `, [
            user.id, 
            'UPDATE', 
            'configuracoes', 
            `Configurações atualizadas por ${user.email}`
          ]);
        } catch (logError) {
          console.error('Erro ao registrar log:', logError.message);
        }
        
        const sucessos = resultados.filter(r => r.success).length;
        const falhas = resultados.filter(r => !r.success).length;
        
        res.status(200).json({ 
          success: falhas === 0,
          message: `Configurações salvas: ${sucessos} com sucesso, ${falhas} falhas`,
          resultados,
          atualizadas: sucessos
        });
        
      } catch (error) {
        console.error('Erro geral ao salvar configurações:', error);
        res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      break;

    case 'POST':
      try {
        const { action } = req.body;
        
        if (action === 'reset-cache') {
          try {
            await query('DEALLOCATE ALL');
            console.log('Cache de prepared statements limpo');
          } catch (cacheError) {
            console.log('Não foi possível limpar cache:', cacheError.message);
          }
          
          await query(`
            INSERT INTO logs_sistema 
              (usuario_id, acao, modulo, descricao)
            VALUES ($1, $2, $3, $4)
          `, [
            user.id, 
            'SYSTEM', 
            'cache', 
            `Cache limpo por ${user.email}`
          ]);
          
          res.status(200).json({ 
            success: true, 
            message: 'Cache limpo com sucesso' 
          });
          
        } else if (action === 'backup') {
          const backupData = {
            data: new Date().toISOString(),
            admin: user.email,
            dados: {
              usuarios: (await query('SELECT COUNT(*) as total FROM usuarios')).rows[0],
              cursos: (await query('SELECT COUNT(*) as total FROM cursos')).rows[0],
              matriculas: (await query('SELECT COUNT(*) as total FROM matriculas')).rows[0],
              certificados: (await query('SELECT COUNT(*) as total FROM certificados')).rows[0],
              configuracoes: (await query('SELECT COUNT(*) as total FROM configuracoes_sistema')).rows[0]
            },
            configuracoes: {}
          };
          
          const configs = await query(`
            SELECT chave, valor, tipo, categoria, descricao 
            FROM configuracoes_sistema 
            ORDER BY chave
          `);
          
          configs.rows.forEach(row => {
            backupData.configuracoes[row.chave] = row.valor;
          });
          
          await query(`
            INSERT INTO logs_sistema 
              (usuario_id, acao, modulo, descricao)
            VALUES ($1, $2, $3, $4)
          `, [
            user.id, 
            'BACKUP', 
            'sistema', 
            `Backup realizado por ${user.email}`
          ]);
          
          res.status(200).json({
            success: true,
            data: backupData
          });
          
        } else if (action === 'reset-defaults') {
          // Deletar todas as configurações existentes
          await query('DELETE FROM configuracoes_sistema');
          
          // Inserir padrões novamente uma por uma
          for (const [chave, valor] of Object.entries(DEFAULT_CONFIG)) {
            const valorString = valorParaString(valor);
            const tipo = determinarTipo(valor);
            
            await query(`
              INSERT INTO configuracoes_sistema (chave, valor, tipo) 
              VALUES ($1, $2, $3)
            `, [chave, valorString, tipo]);
          }
          
          await query(`
            INSERT INTO logs_sistema 
              (usuario_id, acao, modulo, descricao)
            VALUES ($1, $2, $3, $4)
          `, [
            user.id, 
            'RESET', 
            'configuracoes', 
            `Configurações resetadas para padrão por ${user.email}`
          ]);
          
          res.status(200).json({ 
            success: true, 
            message: 'Configurações padrão restauradas' 
          });
          
        } else {
          res.status(400).json({ 
            success: false,
            message: 'Ação inválida' 
          });
        }
        
      } catch (error) {
        console.error('Erro na ação do sistema:', error);
        res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      res.status(405).json({ 
        success: false,
        message: `Método ${req.method} não permitido`,
        allowed: ['GET', 'PUT', 'POST']
      });
  }
}

export default withCors(handler);