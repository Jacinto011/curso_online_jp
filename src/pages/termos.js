import React, { useState } from 'react';
import Link from 'next/link';

export default function TermosPoliticaPage() {
  const [activeSection, setActiveSection] = useState('termos');

  const termsSections = [
    {
      id: 'uso',
      title: 'Termos de Uso',
      content: `
        <h4>1. Aceitação dos Termos</h4>
        <p>Ao acessar e usar a plataforma JP Business, você concorda em cumprir estes Termos de Uso.</p>
        
        <h4>2. Cadastro na Plataforma</h4>
        <p>Para acessar determinadas funcionalidades, é necessário criar uma conta. Você é responsável por:</p>
        <ul>
          <li>Fornecer informações verdadeiras e atualizadas</li>
          <li>Manter a confidencialidade da sua senha</li>
          <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
        </ul>
        
        <h4>3. Uso Aceitável</h4>
        <p>Você concorda em não:</p>
        <ul>
          <li>Violar leis ou regulamentos aplicáveis</li>
          <li>Infringir direitos de propriedade intelectual</li>
          <li>Usar a plataforma para atividades fraudulentas</li>
          <li>Interferir na segurança ou funcionalidade da plataforma</li>
          <li>Compartilhar conteúdo ofensivo, difamatório ou ilegal</li>
        </ul>
        
        <h4>4. Propriedade Intelectual</h4>
        <p>Todos os conteúdos dos cursos são de propriedade dos respectivos instrutores ou da JP Business. 
        A compra de um curso concede uma licença pessoal, não transferível, para uso do conteúdo.</p>
        
        <h4>5. Pagamentos e Reembolsos</h4>
        <p>Pagamentos são processados através de gateways seguros. Oferecemos garantia de 7 dias para reembolso, 
        desde que o curso não tenha sido acessado em mais de 30% do conteúdo total.</p>
      `
    },
    {
      id: 'privacy',
      title: 'Política de Privacidade',
      content: `
        <h4>1. Informações Coletadas</h4>
        <p>Coletamos as seguintes informações:</p>
        <ul>
          <li><strong>Informações pessoais:</strong> nome, email, telefone</li>
          <li><strong>Informações acadêmicas:</strong> cursos comprados, progresso, certificados</li>
          <li><strong>Informações de pagamento:</strong> processadas por provedores terceiros seguros</li>
          <li><strong>Dados de uso:</strong> páginas visitadas, tempo na plataforma</li>
        </ul>
        
        <h4>2. Uso das Informações</h4>
        <p>Usamos suas informações para:</p>
        <ul>
          <li>Fornecer e melhorar nossos serviços</li>
          <li>Processar pagamentos e emitir certificados</li>
          <li>Comunicar atualizações importantes</li>
          <li>Personalizar sua experiência de aprendizado</li>
          <li>Cumprir obrigações legais</li>
        </ul>
        
        <h4>3. Proteção de Dados</h4>
        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:</p>
        <ul>
          <li>Criptografia SSL/TLS para transmissão de dados</li>
          <li>Armazenamento seguro em servidores</li>
          <li>Controle de acesso restrito</li>
          <li>Backups regulares</li>
        </ul>
        
        <h4>4. Seus Direitos</h4>
        <p>Você tem direito a:</p>
        <ul>
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados imprecisos</li>
          <li>Solicitar exclusão de dados</li>
          <li>Retirar consentimento</li>
          <li>Exportar seus dados</li>
        </ul>
        
        <h4>5. Cookies e Tecnologias Semelhantes</h4>
        <p>Utilizamos cookies para:</p>
        <ul>
          <li>Manter sua sessão ativa</li>
          <li>Lembrar suas preferências</li>
          <li>Analisar uso da plataforma</li>
          <li>Melhorar performance</li>
        </ul>
      `
    },
    {
      id: 'cookies',
      title: 'Política de Cookies',
      content: `
        <h4>1. O que são Cookies?</h4>
        <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nossa plataforma.</p>
        
        <h4>2. Tipos de Cookies que Usamos</h4>
        <ul>
          <li><strong>Cookies Essenciais:</strong> Necessários para funcionamento básico</li>
          <li><strong>Cookies de Performance:</strong> Monitoram como você usa a plataforma</li>
          <li><strong>Cookies de Funcionalidade:</strong> Lembram suas preferências</li>
          <li><strong>Cookies de Marketing:</strong> Mostram anúncios relevantes</li>
        </ul>
        
        <h4>3. Gerenciamento de Cookies</h4>
        <p>Você pode controlar cookies através das configurações do seu navegador. Note que desativar cookies 
        essenciais pode afetar a funcionalidade da plataforma.</p>
      `
    },
    {
      id: 'pagamentos',
      title: 'Política de Pagamentos',
      content: `
        <h4>1. Métodos de Pagamento Aceitos</h4>
        <p>Aceitamos os seguintes métodos de pagamento:</p>
        <ul>
          <li>M-Pesa</li>
          <li>E-Mola</li>
          <li>Transferência Bancária</li>
          <li>Cartão de Crédito/Débito (Visa, MasterCard)</li>
          <li>Depósito em Conta</li>
        </ul>
        
        <h4>2. Processamento de Pagamentos</h4>
        <p>Pagamentos são processados por gateways seguros. Não armazenamos informações de cartão de crédito 
        em nossos servidores.</p>
        
        <h4>3. Preços e Taxas</h4>
        <p>Todos os preços são em Meticais (MZN) e incluem IVA quando aplicável. Reservamo-nos o direito de 
        alterar preços, dando aviso prévio de 30 dias.</p>
        
        <h4>4. Reembolsos</h4>
        <p>Política de reembolso de 7 dias a partir da data de compra, desde que:</p>
        <ul>
          <li>O curso não tenha sido acessado em mais de 30%</li>
          <li>A solicitação seja feita através do suporte oficial</li>
          <li>Não seja um curso em promoção sem reembolso</li>
        </ul>
        
        <h4>5. Faturação</h4>
        <p>Emitimos recibo eletrônico para todas as transações. Certificados só são emitidos após confirmação 
        de pagamento.</p>
      `
    },
    {
      id: 'conteudo',
      title: 'Política de Conteúdo',
      content: `
        <h4>1. Direitos Autorais</h4>
        <p>Todos os materiais dos cursos são protegidos por direitos autorais. A compra concede licença 
        pessoal de uso, não comercial.</p>
        
        <h4>2. Uso Aceitável do Conteúdo</h4>
        <p>Você pode:</p>
        <ul>
          <li>Acessar conteúdo para aprendizado pessoal</li>
          <li>Fazer anotações para uso pessoal</li>
          <li>Completar exercícios e atividades</li>
        </ul>
        
        <p>Você NÃO pode:</p>
        <ul>
          <li>Reproduzir, distribuir ou vender o conteúdo</li>
          <li>Compartilhar acesso à sua conta</li>
          <li>Usar conteúdo para fins comerciais</li>
          <li>Criar obras derivadas sem autorização</li>
        </ul>
        
        <h4>3. Conteúdo do Usuário</h4>
        <p>Ao enviar conteúdo (comentários, projetos, etc.), você nos concede licença para usar, 
        modificar e exibir esse conteúdo na plataforma.</p>
        
        <h4>4. Remoção de Conteúdo</h4>
        <p>Reservamo-nos o direito de remover conteúdo que viole nossos termos ou seja considerado inadequado.</p>
      `
    }
  ];

  return (
    <div className="container py-5">
      {/* Cabeçalho */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10 text-center">
          <h1 className="display-4 fw-bold mb-3">
            Termos & <span className="text-primary">Políticas</span>
          </h1>
          <p className="lead text-muted">
            Transparência e clareza em nossas práticas e compromissos
          </p>
          <div className="badge bg-primary text-white px-3 py-2">
            <i className="bi bi-shield-check me-2"></i>
            Última atualização: Janeiro 2024
          </div>
        </div>
      </div>

      {/* Navegação entre seções */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {termsSections.map((section) => (
                  <button
                    key={section.id}
                    className={`btn ${activeSection === section.id ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da seção ativa */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              {termsSections
                .filter(section => section.id === activeSection)
                .map(section => (
                  <div key={section.id}>
                    <h2 className="h1 mb-4">{section.title}</h2>
                    <div 
                      className="terms-content"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                    
                    {/* Avisos importantes */}
                    <div className="alert alert-info mt-4">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      <strong>Importante:</strong> Esta página é atualizada regularmente. 
                      Recomendamos verificar periodicamente por mudanças.
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Contato para Dúvidas */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body p-5 text-center">
              <h3 className="h2 mb-3">
                <i className="bi bi-question-circle text-primary me-2"></i>
                Dúvidas sobre nossos Termos?
              </h3>
              <p className="lead mb-4">
                Entre em contato com nossa equipe jurídica ou de suporte
              </p>
              <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body p-4">
                          <i className="bi bi-envelope-fill text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                          <h5 className="card-title">Email Jurídico</h5>
                          <a 
                            href="mailto:jacintopatricio9@gmail.com?subject=Dúvida sobre Termos e Políticas" 
                            className="btn btn-outline-primary btn-sm"
                          >
                            Enviar Email
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body p-4">
                          <i className="bi bi-whatsapp text-success mb-3" style={{ fontSize: '2rem' }}></i>
                          <h5 className="card-title">WhatsApp</h5>
                          <button 
                            onClick={() => window.open(`https://wa.me/25884005964?text=Olá, tenho dúvidas sobre os termos e políticas`, '_blank')}
                            className="btn btn-outline-success btn-sm"
                          >
                            Conversar no WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aceitação dos Termos */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm border-top border-primary border-3">
            <div className="card-body p-5">
              <h3 className="h2 mb-3 text-center">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                Aceitação dos Termos
              </h3>
              <p className="text-center lead mb-4">
                Ao usar nossa plataforma, você concorda com todos os termos e políticas acima
              </p>
              
              <div className="alert alert-warning">
                <div className="d-flex">
                  <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                  <div>
                    <h5 className="alert-heading">Aviso Legal</h5>
                    <p className="mb-0">
                      Estes documentos constituem um acordo legal entre você e a JP Business. 
                      É sua responsabilidade ler e entender estes termos antes de usar nossos serviços.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link href="/" className="btn btn-primary btn-lg px-5">
                  <i className="bi bi-house-door me-2"></i>
                  Voltar para Home
                </Link>
                <p className="text-muted small mt-3">
                  Continuar navegando em nosso site indica sua aceitação destes termos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}