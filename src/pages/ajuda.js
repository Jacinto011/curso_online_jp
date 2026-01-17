import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function StudentHelpPage() {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    course: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const { user } = useAuth();

  // Dados de suporte fornecidos
  const supportData = {
    email: 'jacintopatricio9@gmail.com',
    phone: '+258 83 514 8213',
    whatsapp: '+258 84 005 964',
    nif: '864005964',
    business: 'JP Business',
    operatingHours: 'Segunda a Sexta: 8h00 - 18h00 | Sábado: 9h00 - 13h00'
  };

  // FAQ - Perguntas frequentes
  const faqs = [
    {
      id: 1,
      question: 'Como faço para comprar um curso?',
      answer: '1. Navegue até a página "Cursos" 2. Escolha o curso desejado 3. Clique em "Comprar Agora" 4. Complete o processo de pagamento 5. Acesso imediato após confirmação'
    },
    {
      id: 2,
      question: 'Quais métodos de pagamento aceitam?',
      answer: 'Aceitamos: M-Pesa, E-Mola, depósito bancário, transferência bancária, cartão de crédito/débito (Visa, MasterCard) e carteiras digitais.'
    },
    {
      id: 3,
      question: 'Como acessar um curso após a compra?',
      answer: '1. Faça login na sua conta 2. Vá para "Meus Cursos" no menu do estudante 3. Clique no curso adquirido 4. Comece a assistir às aulas imediatamente'
    },
    {
      id: 4,
      question: 'Posso baixar as aulas para assistir offline?',
      answer: 'Sim! A maioria dos cursos permite download de materiais. Procure o botão de download ao lado de cada aula ou na seção de materiais.'
    },
    {
      id: 5,
      question: 'Como obtenho meu certificado?',
      answer: 'Certificados são emitidos automaticamente após conclusão de 100% do curso. Vá para "Meus Certificados" no dashboard para visualizar e baixar.'
    },
    {
      id: 6,
      question: 'Tem garantia de reembolso?',
      answer: 'Oferecemos garantia de 7 dias. Se não estiver satisfeito, entre em contato via suporte dentro deste período para solicitar reembolso.'
    },
    {
      id: 7,
      question: 'Os cursos têm prazo de acesso?',
      answer: 'Acesso vitalício! Uma vez adquirido, você tem acesso permanente ao curso e futuras atualizações gratuitas.'
    },
    {
      id: 8,
      question: 'Como entro em contato com o instrutor?',
      answer: 'Dentro de cada curso há uma seção "Perguntas e Respostas" onde pode interagir diretamente com o instrutor.'
    }
  ];

  // Guias rápidos
  const quickGuides = [
    {
      title: 'Primeiros Passos',
      icon: 'bi-rocket-takeoff',
      steps: [
        'Crie sua conta',
        'Explore os cursos',
        'Faça sua primeira compra',
        'Comece a aprender'
      ]
    },
    {
      title: 'Solução de Problemas',
      icon: 'bi-tools',
      steps: [
        'Limpe cache do navegador',
        'Verifique sua conexão',
        'Tente outro navegador',
        'Contate o suporte se persistir'
      ]
    },
    {
      title: 'Dicas de Estudo',
      icon: 'bi-lightbulb',
      steps: [
        'Estabeleça uma rotina',
        'Faça anotações',
        'Participe das discussões',
        'Pratique regularmente'
      ]
    }
  ];

  const handleFAQToggle = (id) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você implementaria o envio para o backend
    console.log('Formulário enviado:', contactForm);
    setSubmitted(true);
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      course: ''
    });
    
    // Reset após 5 segundos
    setTimeout(() => setSubmitted(false), 5000);
  };

  const openWhatsApp = () => {
    const message = `Olá, preciso de ajuda com a plataforma de cursos.`;
    const url = `https://wa.me/${supportData.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container py-5">
      {/* Cabeçalho */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">Central de Ajuda</h1>
        <p className="lead text-muted mb-4">
          Encontre respostas, tutoriais e entre em contato com nosso suporte
        </p>
      </div>

      {/* Alertas importantes */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="alert alert-info border-0 shadow-sm">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
              <div>
                <h5 className="alert-heading mb-1">Atenção Estudantes!</h5>
                <p className="mb-0">
                  Para atendimento rápido, utilize o WhatsApp. Nossos canais de suporte são monitorados durante o horário comercial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Contato Rápido */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="h3 mb-4 border-bottom pb-2">
            <i className="bi bi-headset me-2"></i>
            Contato Direto
          </h2>
          
          <div className="row g-4">
            {/* WhatsApp */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-whatsapp text-success" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title mb-3">WhatsApp</h5>
                  <p className="card-text text-muted small mb-3">
                    Resposta rápida via mensagem
                  </p>
                  <button 
                    onClick={openWhatsApp}
                    className="btn btn-success w-100"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    Conversar Agora
                  </button>
                  <small className="text-muted mt-2 d-block">
                    {supportData.whatsapp}
                  </small>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-envelope-fill text-primary" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title mb-3">Email</h5>
                  <p className="card-text text-muted small mb-3">
                    Suporte detalhado por email
                  </p>
                  <a 
                    href={`mailto:${supportData.email}?subject=Suporte Plataforma de Cursos`}
                    className="btn btn-primary w-100"
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Enviar Email
                  </a>
                  <small className="text-muted mt-2 d-block">
                    {supportData.email}
                  </small>
                </div>
              </div>
            </div>

            {/* Telefone */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-telephone-fill text-warning" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title mb-3">Telefone</h5>
                  <p className="card-text text-muted small mb-3">
                    Atendimento por chamada
                  </p>
                  <a 
                    href={`tel:${supportData.phone}`}
                    className="btn btn-warning text-white w-100"
                  >
                    <i className="bi bi-telephone me-2"></i>
                    Ligar Agora
                  </a>
                  <small className="text-muted mt-2 d-block">
                    {supportData.phone}
                  </small>
                </div>
              </div>
            </div>

            {/* Informações da Empresa */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-building text-info" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="card-title mb-3">{supportData.business}</h5>
                  <p className="card-text text-muted small mb-2">
                    <strong>NIF:</strong> {supportData.nif}
                  </p>
                  <p className="card-text text-muted small mb-3">
                    <strong>Horário:</strong> {supportData.operatingHours}
                  </p>
                  <div className="badge bg-info text-white">
                    <i className="bi bi-shield-check me-1"></i>
                    Empresa Registrada
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guias Rápidos */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="h3 mb-4 border-bottom pb-2">
            <i className="bi bi-compass me-2"></i>
            Guias Rápidos
          </h2>
          
          <div className="row g-4">
            {quickGuides.map((guide, index) => (
              <div className="col-md-4" key={index}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <i className={`bi ${guide.icon} me-3 text-primary`} style={{ fontSize: '2rem' }}></i>
                      <h5 className="card-title mb-0">{guide.title}</h5>
                    </div>
                    <ol className="ps-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="mb-2">
                          <small>{step}</small>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="h3 mb-4 border-bottom pb-2">
            <i className="bi bi-question-circle me-2"></i>
            Perguntas Frequentes (FAQ)
          </h2>
          
          <div className="accordion" id="faqAccordion">
            {faqs.map((faq) => (
              <div className="accordion-item border-0 mb-3 shadow-sm" key={faq.id}>
                <h3 className="accordion-header">
                  <button
                    className={`accordion-button ${activeFAQ === faq.id ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => handleFAQToggle(faq.id)}
                  >
                    <i className="bi bi-question-circle-fill text-primary me-3"></i>
                    {faq.question}
                  </button>
                </h3>
                <div className={`accordion-collapse collapse ${activeFAQ === faq.id ? 'show' : ''}`}>
                  <div className="accordion-body">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário de Contato */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="h3 mb-4 border-bottom pb-2">
                <i className="bi bi-chat-dots me-2"></i>
                Envie sua Mensagem
              </h2>
              
              {submitted ? (
                <div className="alert alert-success text-center">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Mensagem enviada com sucesso! Entraremos em contato em breve.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Se usuário estiver logado, preencher automaticamente */}
                    {user ? (
                      <>
                        <input type="hidden" name="name" value={user.name || ''} />
                        <input type="hidden" name="email" value={user.email || ''} />
                      </>
                    ) : (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Seu Nome *</label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={contactForm.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Seu Email *</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={contactForm.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="col-md-6">
                      <label className="form-label">Assunto *</label>
                      <select
                        name="subject"
                        className="form-select"
                        value={contactForm.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="Problema técnico">Problema técnico</option>
                        <option value="Dúvida sobre curso">Dúvida sobre curso</option>
                        <option value="Pagamento">Pagamento</option>
                        <option value="Certificado">Certificado</option>
                        <option value="Sugestão">Sugestão</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Curso (opcional)</label>
                      <input
                        type="text"
                        name="course"
                        className="form-control"
                        value={contactForm.course}
                        onChange={handleInputChange}
                        placeholder="Nome do curso relacionado"
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Mensagem *</label>
                      <textarea
                        name="message"
                        className="form-control"
                        rows="5"
                        value={contactForm.message}
                        onChange={handleInputChange}
                        required
                        placeholder="Descreva em detalhes como podemos ajudar..."
                      ></textarea>
                    </div>
                    
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary btn-lg">
                        <i className="bi bi-send me-2"></i>
                        Enviar Mensagem
                      </button>
                      <small className="text-muted ms-3">
                        * Responderemos em até 24 horas úteis
                      </small>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Links Úteis */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">
                <i className="bi bi-link-45deg me-2"></i>
                Links Úteis
              </h5>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/cursos" className="btn btn-outline-primary">
                  <i className="bi bi-book me-1"></i>
                  Ver Todos os Cursos
                </Link>
                <Link href="/student" className="btn btn-outline-success">
                  <i className="bi bi-speedometer2 me-1"></i>
                  Meu Dashboard
                </Link>
                <Link href="/auth/login" className="btn btn-outline-warning">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Acessar Conta
                </Link>
                <Link href="/sobre" className="btn btn-outline-info">
                  <i className="bi bi-info-circle me-1"></i>
                  Sobre a Plataforma
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}