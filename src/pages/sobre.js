import React from 'react';
import Link from 'next/link';

export default function SobrePage() {
  const teamMembers = [
    {
      id: 1,
      name: 'Jacinto Patrício',
      role: 'Fundador & CEO',
      bio: 'Especialista em educação online com 10+ anos de experiência',
      email: 'jacintopatricio9@gmail.com',
      phone: '+258 83 514 8213'
    },
    {
      id: 2,
      name: 'Maria Fernandes',
      role: 'Diretora Pedagógica',
      bio: 'Doutora em Educação com foco em tecnologias educacionais'
    },
    {
      id: 3,
      name: 'Carlos Silva',
      role: 'Head de Tecnologia',
      bio: 'Desenvolvedor Full Stack com expertise em plataformas educacionais'
    },
    {
      id: 4,
      name: 'Ana Pereira',
      role: 'Gerente de Suporte',
      bio: 'Especialista em atendimento ao cliente e suporte técnico'
    }
  ];

  const milestones = [
    { year: '2020', event: 'Fundação da JP Business' },
    { year: '2021', event: 'Lançamento da primeira versão da plataforma' },
    { year: '2022', event: 'Atingimos 1.000 estudantes ativos' },
    { year: '2023', event: 'Expansão para cursos em múltiplas áreas' },
    { year: '2024', event: 'Lançamento de certificação digital' }
  ];

  const values = [
    {
      icon: 'bi-award-fill',
      title: 'Excelência',
      description: 'Compromisso com a qualidade em todos os nossos cursos'
    },
    {
      icon: 'bi-people-fill',
      title: 'Acessibilidade',
      description: 'Educação de qualidade acessível a todos'
    },
    {
      icon: 'bi-lightbulb-fill',
      title: 'Inovação',
      description: 'Constantemente melhorando nossa plataforma'
    },
    {
      icon: 'bi-shield-check',
      title: 'Confiança',
      description: 'Transparência e segurança para nossos usuários'
    }
  ];

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10 text-center">
          <h1 className="display-4 fw-bold mb-4">
            Sobre a <span className="text-primary">JP Business</span>
          </h1>
          <p className="lead text-muted mb-4">
            Transformando vidas através da educação online de qualidade desde 2020
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link href="/cursos" className="btn btn-primary btn-lg px-4">
              <i className="bi bi-book me-2"></i>
              Ver Cursos
            </Link>
            <Link href="/contato" className="btn btn-outline-primary btn-lg px-4">
              <i className="bi bi-chat-dots me-2"></i>
              Fale Conosco
            </Link>
          </div>
        </div>
      </div>

      {/* Missão, Visão, Valores */}
      <div className="row mb-5">
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-bullseye text-primary" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Missão</h3>
              <p className="text-muted">
                Democratizar o acesso à educação de qualidade através de uma plataforma online 
                inovadora, capacitando pessoas para transformarem suas carreiras e vidas.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-eye-fill text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Visão</h3>
              <p className="text-muted">
                Ser a principal referência em educação online em Moçambique, 
                impactando positivamente mais de 100.000 estudantes até 2025.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-heart-fill text-danger" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Valores</h3>
              <ul className="text-muted text-start">
                <li>Excelência educacional</li>
                <li>Inovação constante</li>
                <li>Compromisso com resultados</li>
                <li>Comunidade colaborativa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Nossa História */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="h1 mb-4 text-center">Nossa História</h2>
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <p className="lead mb-4">
                    Fundada em 2020 por <strong>Jacinto Patrício</strong>, a JP Business nasceu 
                    da paixão por educação e tecnologia. Percebendo a necessidade de educação 
                    acessível e de qualidade em Moçambique, criamos uma plataforma que conecta 
                    estudantes a instrutores especializados.
                  </p>
                  <p>
                    Começamos com apenas 3 cursos e hoje oferecemos uma vasta gama de 
                    formações em diversas áreas, sempre com foco na qualidade do conteúdo 
                    e na experiência do estudante.
                  </p>
                  <div className="mt-4">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span>+5.000 estudantes impactados</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span>+50 cursos disponíveis</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span>+100 instrutores qualificados</span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="timeline mt-4 mt-lg-0">
                    <h4 className="mb-4">Marcos Importantes</h4>
                    {milestones.map((milestone, index) => (
                      <div className="timeline-item mb-3" key={index}>
                        <div className="timeline-date badge bg-primary">
                          {milestone.year}
                        </div>
                        <div className="timeline-content">
                          <p className="mb-0">{milestone.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nossos Valores Detalhados */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="h1 mb-4 text-center">Nossos Valores</h2>
          <div className="row g-4">
            {values.map((value, index) => (
              <div className="col-md-3" key={index}>
                <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                  <div className="card-body p-4">
                    <i className={`bi ${value.icon} text-primary mb-3`} style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="card-title mb-3">{value.title}</h5>
                    <p className="card-text text-muted">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipe */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="h1 mb-4 text-center">Nossa Equipe</h2>
          <div className="row g-4">
            {teamMembers.map((member) => (
              <div className="col-md-6 col-lg-3" key={member.id}>
                <div className="card h-100 border-0 shadow-sm text-center">
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <div className="avatar-placeholder rounded-circle bg-primary d-inline-flex align-items-center justify-content-center text-white"
                           style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                        {member.name.charAt(0)}
                      </div>
                    </div>
                    <h5 className="card-title mb-2">{member.name}</h5>
                    <p className="card-subtitle text-primary mb-3">{member.role}</p>
                    <p className="card-text text-muted small mb-3">{member.bio}</p>
                    {member.email && (
                      <div className="small">
                        <i className="bi bi-envelope me-1"></i>
                        <a href={`mailto:${member.email}`} className="text-decoration-none">
                          {member.email}
                        </a>
                      </div>
                    )}
                    {member.phone && (
                      <div className="small">
                        <i className="bi bi-telephone me-1"></i>
                        {member.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações Legais */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body p-4">
              <h3 className="h4 mb-3">
                <i className="bi bi-building me-2"></i>
                Informações Legais
              </h3>
              <div className="row">
                <div className="col-md-6">
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <strong>Nome Empresarial:</strong> JP Business
                    </li>
                    <li className="mb-2">
                      <strong>NIF:</strong> 864005964
                    </li>
                    <li className="mb-2">
                      <strong>Email:</strong> jacintopatricio9@gmail.com
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <strong>Telefone:</strong> +258 83 514 8213
                    </li>
                    <li className="mb-2">
                      <strong>WhatsApp:</strong> +258 84 005 964
                    </li>
                    <li className="mb-2">
                      <strong>Horário de Funcionamento:</strong> Seg-Sex 8h-18h
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="row mt-5">
        <div className="col-12 text-center">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body p-5">
              <h2 className="h1 mb-3">Pronto para Começar?</h2>
              <p className="lead mb-4 opacity-75">
                Junte-se a milhares de estudantes que estão transformando suas carreiras
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link href="/auth/register" className="btn btn-light btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>
                  Criar Conta Gratuita
                </Link>
                <Link href="/cursos" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-play-circle me-2"></i>
                  Ver Cursos Gratuitos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}