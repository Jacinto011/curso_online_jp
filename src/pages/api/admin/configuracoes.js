import { initializeDatabase } from '../../../lib/database';
import { authenticate } from '../../../lib/auth';

// Configurações padrão
const DEFAULT_CONFIG = {
  nome_plataforma: 'Plataforma de Cursos Online',
  email_suporte: 'suporte@curso.com',
  url_plataforma: 'http://localhost:3000',
  manutencao: false,
  novos_cursos_aprovacao: false,
  limite_matriculas: 100,
  tempo_sessao: 24
};

export default async function handler(req, res) {
  const db = await initializeDatabase();
  
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Em um sistema real, estas configurações estariam em uma tabela
        // Por simplicidade, vamos retornar as configurações padrão
        res.status(200).json(DEFAULT_CONFIG);
        
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const configuracoes = req.body;
        
        // Validar configurações
        const configValida = {
          nome_plataforma: configuracoes.nome_plataforma || DEFAULT_CONFIG.nome_plataforma,
          email_suporte: configuracoes.email_suporte || DEFAULT_CONFIG.email_suporte,
          url_plataforma: configuracoes.url_plataforma || DEFAULT_CONFIG.url_plataforma,
          manutencao: Boolean(configuracoes.manutencao),
          novos_cursos_aprovacao: Boolean(configuracoes.novos_cursos_aprovacao),
          limite_matriculas: parseInt(configuracoes.limite_matriculas) || DEFAULT_CONFIG.limite_matriculas,
          tempo_sessao: parseInt(configuracoes.tempo_sessao) || DEFAULT_CONFIG.tempo_sessao
        };
        
        // Em um sistema real, salvaríamos no banco de dados
        // Por enquanto, apenas retornamos as configurações atualizadas
        console.log('Configurações atualizadas:', configValida);
        
        res.status(200).json({ 
          success: true, 
          message: 'Configurações salvas com sucesso',
          configuracoes: configValida 
        });
        
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;

    case 'POST':
      try {
        const { action } = req.body;
        
        if (action === 'reset-cache') {
          // Lógica para limpar cache
          console.log('Cache limpo pelo admin:', user.id);
          res.status(200).json({ 
            success: true, 
            message: 'Cache limpo com sucesso' 
          });
          
        } else if (action === 'backup') {
          // Lógica para backup
          const backupData = {
            data: new Date().toISOString(),
            admin: user.email,
            dados: {
              usuarios: await db.all('SELECT COUNT(*) as total FROM usuarios'),
              cursos: await db.all('SELECT COUNT(*) as total FROM cursos'),
              matriculas: await db.all('SELECT COUNT(*) as total FROM matriculas')
            }
          };
          
          res.status(200).json(backupData);
          
        } else {
          res.status(400).json({ message: 'Ação inválida' });
        }
        
      } catch (error) {
        console.error('Erro na ação do sistema:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}