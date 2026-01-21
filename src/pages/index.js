import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// Dados da plataforma - Atualizado com nova paleta de cores
const platformData = {
  name: "Curso Online JP",
  email: "jacintopatricio9@gmail.com",
  phones: ["+244 864 005 964", "+244 835 148 213"],
  developer: {
    name: "JP Business",
    url: "https://jp-business.vercel.app/"
  },
  stats: [
    { id: 1, value: "50", label: "Usuários Simultâneos", suffix: "+" },
    { id: 2, value: "10", label: "Cursos Premium", suffix: "" },
    { id: 3, value: "100", label: "Satisfação", suffix: "%" },
    { id: 4, value: "24", label: "Suporte Técnico", suffix: "/7" }
  ],
  philosophy: [
    {
      id: 1,
      type: "visão",
      title: "Visão",
      description: "Ser a principal referência em educação digital na região, transformando a maneira como as pessoas aprendem e compartilham conhecimento. Buscamos criar uma comunidade global de aprendizado contínuo, onde a tecnologia e a educação se unem para criar experiências transformadoras.",
      icon: "👁️",
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      type: "missão",
      title: "Missão",
      description: "Democratizar o acesso à educação de qualidade através de uma plataforma tecnológica inovadora, intuitiva e acessível. Facilitar a conexão entre instrutores talentosos e alunos dedicados, criando um ecossistema onde o conhecimento pode ser compartilhado, adquirido e aplicado de maneira eficiente.",
      icon: "🎯",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      type: "valores",
      title: "Valores",
      description: "Inovação Contínua, Qualidade Premium, Acessibilidade e Comunidade. Compromisso com a excelência em todos os aspectos da plataforma, valorizando a conexão humana e o compartilhamento de conhecimento.",
      icon: "❤️",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ],
  highlights: [
    {
      id: 1,
      title: "Interface Moderna e Intuitiva",
      description: "Design pensado para oferecer a melhor experiência de usuário, com navegação fluida e acessibilidade total.",
      image: "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 2,
      title: "Conteúdo Interativo",
      description: "Vídeos, quizzes, fóruns e atividades práticas que mantêm os alunos engajados e motivados.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 3,
      title: "Dashboard Analítico Completo",
      description: "Controle total sobre o desempenho dos alunos, relatórios detalhados e insights valiosos.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 4,
      title: "Acesso em Qualquer Dispositivo",
      description: "Plataforma 100% responsiva que funciona perfeitamente em computadores, tablets e smartphones.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
    }
  ],
  featuredCourses: [
    {
      id: 1,
      title: "Programação em Python",
      category: "Tecnologia",
      description: "Aprenda Python do zero ao avançado com projetos práticos e aplicações reais.",
      image: "https://imgv2-1-f.scribdassets.com/img/document/662709120/original/f00c88b0ae/1718656035?v=1",
      level: "Iniciante",
      price: 500,
      duration: "40 horas",
      rating: 4.9,
      students: 45,
      url: "/cursos/1"
    },
    {
      id: 2,
      title: "Marketing Digital Completo",
      category: "Marketing",
      description: "Domine as estratégias de marketing digital para alavancar negócios online.",
      image: "https://tse1.mm.bing.net/th/id/OIP.-JY9jl406ZFS5qnqIGgIKQHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
      level: "Intermediário",
      price: 1800,
      duration: "35 horas",
      rating: 4.8,
      students: 38,
      url: "/cursos/2"
    },
    {
      id: 3,
      title: "Crescimento Pessoal",
      category: "Desenvolvimento",
      description: "Desenvolva habilidades emocionais e profissionais para alcançar seu potencial máximo.",
      image: "https://tse3.mm.bing.net/th/id/OIP.uozTi1XweyKRCRzwTAXJQgHaEK?rs=1&pid=ImgDetMain&o=7&rm=30",
      level: "Todos",
      price: 750,
      duration: "25 horas",
      rating: 4.9,
      students: 52,
      url: "/cursos/3"
    },
    {
      id: 4,
      title: "Design Grafico e Edicao de Videos",
      category: "Design",
      description: "Crie interfaces incríveis e experiências de usuário memoráveis.",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      level: "Intermediário",
      price: 1200,
      duration: "30 horas",
      rating: 4.7,
      students: 28,
      url: "/cursos/6"
    }
  ],
  heroImages: [
    "https://dl.dropboxusercontent.com/scl/fi/csqor664apaxb44oh70og/86e80bc1-dcf1-4935-a238-7e4893d2ae56.png?rlkey=a3q3vnxtl0fkshrjcz3q8y1nv&st=wbhqot4f",
    "https://dl.dropboxusercontent.com/scl/fi/kwkwu4ybpq7qcoi7qy61n/b1b32053-181f-42ef-a844-460efa418c7e.png?rlkey=wo8hznkzbxfs1vio76r2o9fyd&st=mf6te4um",
    "https://dl.dropboxusercontent.com/scl/fi/vif199r7lfh22aqz9aonl/ChatGPT-Image-Jan-20-2026-02_31_07-AM.png?rlkey=wvj3cjuwgz81sr0ty620nhwro&st=x4pe1m01"]
};

// Componente de Carrossel Simples
function SimpleCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [items.length]);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };
  
  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <div className="carousel-content">
          <img 
            src={items[currentIndex]} 
            alt={`Slide ${currentIndex + 1}`}
            className="carousel-image"
          />
        </div>
        
        <button className="carousel-button prev" onClick={prevSlide}>
          ←
        </button>
        <button className="carousel-button next" onClick={nextSlide}>
          →
        </button>
        
        <div className="carousel-dots">
          {items.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .carousel-container {
          width: 100%;
          height: 500px;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .carousel-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .carousel-content {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .carousel-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .carousel-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          color: #2563eb;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .carousel-button:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .carousel-button.prev {
          left: 20px;
        }
        
        .carousel-button.next {
          right: 20px;
        }
        
        .carousel-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        }
        
        .carousel-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .carousel-dot.active {
          background: white;
          transform: scale(1.2);
        }
        
        @media (max-width: 768px) {
          .carousel-container {
            height: 300px;
            border-radius: 20px;
          }
          
          .carousel-button {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }
          
          .carousel-button.prev {
            left: 10px;
          }
          
          .carousel-button.next {
            right: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .carousel-container {
            height: 250px;
            border-radius: 15px;
          }
          
          .carousel-dots {
            bottom: 15px;
          }
          
          .carousel-dot {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function CursoOnlineJP() {
  const [isVisible, setIsVisible] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const statsRef = useRef(null);

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Copiar para área de transferência
  const copyToClipboard = (text, type) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'email') {
          setEmailCopied(true);
          setTimeout(() => setEmailCopied(false), 2000);
        } else if (type === 'phone') {
          setPhoneCopied(true);
          setTimeout(() => setPhoneCopied(false), 2000);
        }
      });
    }
  };

  // Efeitos de animação
  useEffect(() => {
    setIsVisible(true);

    // Animação dos números
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.count-animation');
            counters.forEach(counter => {
              const target = parseFloat(counter.getAttribute('data-target') || '0');
              const suffix = counter.getAttribute('data-suffix') || '';
              const duration = 2000;
              const start = 0;
              const increment = target / (duration / 16);

              let current = start;
              const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                  counter.textContent = target + suffix;
                  clearInterval(timer);
                } else {
                  counter.textContent = Math.floor(current) + suffix;
                }
              }, 16);
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="curso-online-jp">
      {/* Estilos CSS - Atualizado com nova paleta */}
      <style jsx global>{`
        :root {
          --primary-color: #2563eb;
          --primary-light: #dbeafe;
          --secondary-color: #1e40af;
          --accent-color: #3b82f6;
          --light-color: #f8fafc;
          --dark-color: #1e293b;
          --gray-color: #64748b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --gradient-primary: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          --gradient-light: linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background-color: var(--light-color);
          color: var(--dark-color);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          overflow-x: hidden;
          width: 100%;
        }

        .curso-online-jp {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

        /* Classes utilitárias */
        .container {
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Animações */
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-left { animation: fade-in-left 0.8s ease-out; }
        .fade-in-right { animation: fade-in-right 0.8s ease-out; }
        .fade-up { animation: fade-up 0.6s ease-out; }

        /* Estilos específicos */
        .section-title {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
          color: var(--dark-color);
          padding: 0 15px;
        }

        .section-title::after {
          content: '';
          position: absolute;
          width: 80px;
          height: 4px;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gradient-primary);
          border-radius: 2px;
        }

        .cta-button {
          background: var(--gradient-primary);
          color: white;
          padding: 12px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
          border: none;
          cursor: pointer;
          display: inline-block;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          overflow: hidden;
          width: 100%;
        }

        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Grid System */
        .grid {
          display: grid;
          gap: 2rem;
        }

        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

        /* Responsividade */
        @media (max-width: 768px) {
          .section-title {
            font-size: 2rem;
            margin-bottom: 2rem;
          }
          
          .grid-cols-2,
          .grid-cols-3,
          .grid-cols-4 {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .container {
            padding: 0 15px;
          }
          
          .card {
            margin: 0 auto;
            max-width: 100%;
          }
          
          /* Ajustes gerais para mobile */
          h1 { font-size: 2rem !important; }
          h2 { font-size: 1.75rem !important; }
          h3 { font-size: 1.5rem !important; }
          
          p, span, div {
            font-size: 0.95rem !important;
            line-height: 1.5 !important;
          }
          
          /* Hero Section Mobile */
          .hero-section .container > div {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .hero-content h1 {
            font-size: 2.5rem !important;
          }
          
          .hero-content p {
            font-size: 1.1rem !important;
          }
          
          .cta-button {
            width: 100%;
            text-align: center;
            padding: 15px 20px !important;
          }
          
          .hero-section .container > div > div:first-child {
            order: 2;
          }
          
          .hero-section .container > div > div:last-child {
            order: 1;
          }
          
          /* Filosofia Mobile */
          .philosophy-card {
            padding: 1.5rem !important;
            border-radius: 12px !important;
          }
          
          .philosophy-card h3 {
            font-size: 1.5rem !important;
          }
          
          .philosophy-card p {
            font-size: 1rem !important;
            line-height: 1.5 !important;
          }
          
          /* Stats Mobile */
          .stats .grid-cols-4 {
            gap: 1rem !important;
          }
          
          .stats .grid-cols-4 > div {
            padding: 1rem !important;
          }
          
          .stats .grid-cols-4 > div > div {
            font-size: 2rem !important;
          }
          
          .stats .grid-cols-4 > div p {
            font-size: 0.9rem !important;
          }
          
          /* Contato Mobile */
          .contact .grid-cols-2 {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .contact .card {
            padding: 1.5rem !important;
          }
          
          .contact h3 {
            font-size: 1.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .hero-content h1 {
            font-size: 2rem !important;
          }
          
          .hero-content p {
            font-size: 1rem !important;
          }
          
          .hero-section .container > div {
            gap: 1.5rem !important;
          }
          
          .philosophy-card {
            padding: 1rem !important;
          }
          
          .philosophy-card h3 {
            font-size: 1.25rem !important;
          }
          
          .philosophy-card p {
            font-size: 0.95rem !important;
          }
          
          .stats .grid-cols-4 {
            gap: 0.5rem !important;
          }
          
          .stats .grid-cols-4 > div {
            padding: 0.75rem !important;
          }
          
          .stats .grid-cols-4 > div > div {
            font-size: 1.75rem !important;
          }
          
          .contact .card {
            padding: 1rem !important;
          }
          
          .contact h3 {
            font-size: 1.25rem !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .grid-cols-3 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .container {
            padding: 0 30px;
          }
        }

        @media (min-width: 1025px) {
          .container {
            padding: 0 40px;
          }
        }

        /* Espaçamentos */
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
        .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        
        /* Tipografia */
        h1, h2, h3, h4, h5, h6 {
          font-weight: 700;
          line-height: 1.2;
        }
        
        .text-primary { color: var(--primary-color); }
        .text-gray { color: var(--gray-color); }
        .bg-light { background-color: var(--light-color); }
        .bg-primary-light { background-color: var(--primary-light); }
      `}</style>

      {/* Hero Section Melhorada */}
      <section className="hero-section py-12" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4rem',
            alignItems: 'center'
          }}>
            {/* Conteúdo do Hero */}
            <div className={`hero-content ${isVisible ? 'fade-in-left' : ''}`}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-color)',
                borderRadius: '20px',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <span>⭐</span>
                <span>Plataforma de Cursos Online JP</span>
              </div>
              
              <h1 style={{ 
                fontSize: '3.5rem',
                fontWeight: '800',
                marginBottom: '1.5rem',
                color: 'var(--dark-color)',
                lineHeight: '1.1'
              }}>
                Transforme seu conhecimento em <span style={{ color: 'var(--primary-color)' }}>oportunidades</span>
              </h1>
              
              <p style={{ 
                fontSize: '1.25rem',
                color: 'var(--gray-color)',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Aprenda com especialistas, participe de projetos reais e transforme sua carreira com nossa plataforma educacional de ponta.
              </p>
              
              <p style={{ 
                color: 'var(--gray-color)',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Ajudamos estudantes, profissionais e empreendedores a adquirir habilidades valorizadas pelo mercado com cursos práticos e atualizados.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <a href="#cursos" className="cta-button">
                  Ver Cursos Disponíveis
                </a>
              </div>
              
              {/* Mini Cards de Métricas */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>8+</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-color)' }}>Cursos</div>
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>150+</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-color)' }}>Alunos</div>
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>4.9</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-color)' }}>Avaliação</div>
                </div>
              </div>
            </div>
            
            {/* Carrossel do Hero */}
            <div className={isVisible ? 'fade-in-right' : ''}>
              <SimpleCarousel items={platformData.heroImages} />
            </div>
          </div>
        </div>
      </section>

      {/* Cursos em Destaque */}
      <section className="py-16" id="cursos">
        <div className="container">
          <h2 className="section-title">Cursos em Destaque</h2>
          <p style={{ 
            textAlign: 'center',
            color: 'var(--gray-color)',
            fontSize: '1.125rem',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            padding: '0 15px'
          }}>
            Escolha entre nossos cursos mais populares e comece sua jornada de aprendizado hoje mesmo
          </p>
          
          <div className="grid grid-cols-4">
            {platformData.featuredCourses.map((course) => (
              <Link key={course.id} href={course.url} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%' }}>
                  <div style={{ position: 'relative', height: '200px' }}>
                    <img 
                      src={course.image} 
                      alt={course.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem'
                    }}>
                      <span className="badge" style={{ 
                        backgroundColor: 'var(--primary-color)',
                        color: 'white'
                      }}>
                        {course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <span className="badge" style={{ 
                        backgroundColor: course.level === 'Iniciante' ? 'var(--success-color)' : 
                                        course.level === 'Intermediário' ? 'var(--warning-color)' : 
                                        'var(--primary-color)',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}>
                        {course.level}
                      </span>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--warning-color)'
                      }}>
                        <span>⭐</span>
                        <span style={{ fontSize: '0.875rem' }}>{course.rating}</span>
                      </div>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem',
                      color: 'var(--dark-color)'
                    }}>
                      {course.title}
                    </h3>
                    
                    <p style={{ 
                      color: 'var(--gray-color)',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                      lineHeight: '1.4'
                    }}>
                      {course.description}
                    </p>
                    
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto'
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: 'var(--primary-color)'
                        }}>
                          {course.price} MZN
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: 'var(--gray-color)'
                        }}>
                          {course.duration}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--gray-color)',
                        fontSize: '0.875rem'
                      }}>
                        <span>👥</span>
                        <span>{course.students} alunos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a href="/cursos" className="cta-button" style={{ padding: '1rem 2.5rem' }}>
              Ver Todos os Cursos
            </a>
          </div>
        </div>
      </section>

      {/* Filosofia: Visão, Missão, Valores - ATUALIZADO */}
      <section className="mission-vision py-16" id="philosophy" style={{ backgroundColor: 'var(--light-color)' }}>
        <div className="container">
          <h2 className="section-title">Nossa Filosofia</h2>
          
          <div className="space-y-8">
            {platformData.philosophy.map((item, index) => (
              <div 
                key={item.id} 
                className="card philosophy-card"
                style={{ 
                  padding: '2rem',
                  margin: '0 auto',
                  maxWidth: '900px'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : (index % 2 === 0 ? 'row' : 'row-reverse'),
                  gap: '2rem',
                  alignItems: 'center'
                }}>
                  {/* Imagem - Escondida em mobile */}
                  {!isMobile && (
                    <div style={{ 
                      flex: '0 0 300px',
                      height: '300px',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={item.image} 
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Conteúdo */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ 
                        fontSize: '2.5rem',
                        backgroundColor: 'var(--primary-light)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.icon}
                      </div>
                      <h3 style={{ 
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: 'var(--dark-color)',
                        margin: 0
                      }}>
                        {item.title}
                      </h3>
                    </div>
                    
                    <p style={{ 
                      color: 'var(--gray-color)',
                      fontSize: '1.125rem',
                      lineHeight: '1.6'
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="stats py-16" id="stats" ref={statsRef} style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>Nossa Plataforma em Números</h2>
          
          <div className="grid grid-cols-4">
            {platformData.stats.map((stat) => (
              <div key={stat.id} style={{ 
                padding: '2rem', 
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ 
                  fontSize: '3rem',
                  fontWeight: '900',
                  marginBottom: '1rem',
                  lineHeight: '1'
                }}>
                  <span className="count-animation" data-target={stat.value} data-suffix={stat.suffix}>
                    0
                  </span>
                </div>
                <p style={{ fontSize: '1.125rem', opacity: '0.9' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="contact py-16" id="contact">
        <div className="container">
          <h2 className="section-title">Entre em Contato</h2>
          
          <div className="grid grid-cols-2" style={{ gap: '3rem' }}>
            {/* Informações de Contato */}
            <div className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ 
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: 'var(--dark-color)'
              }}>
                Informações de Contato
              </h3>
              
              <div className="space-y-4">
                {/* Email */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'var(--light-color)',
                  transition: 'all 0.3s',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <span style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>✉️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>Email:</div>
                      <div style={{ color: 'var(--gray-color)', wordBreak: 'break-all' }}>{platformData.email}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(platformData.email, 'email')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'transparent',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'var(--primary-color)';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'var(--primary-color)';
                    }}
                  >
                    {emailCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                
                {/* Telefones */}
                {platformData.phones.map((phone, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'var(--light-color)',
                    transition: 'all 0.3s',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <span style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>📞</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>Telefone {index + 1}:</div>
                        <div style={{ color: 'var(--gray-color)' }}>{phone}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(phone.replace(/\D/g, ''), 'phone')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--primary-color)',
                        background: 'transparent',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        width: isMobile ? '100%' : 'auto'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'var(--primary-color)';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--primary-color)';
                      }}
                    >
                      {phoneCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* JP Business */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                borderLeft: '4px solid var(--primary-color)'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--dark-color)' }}>
                  Desenvolvido com Excelência
                </h4>
                <p style={{ color: 'var(--gray-color)', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  Esta plataforma foi criada pela <strong>{platformData.developer.name}</strong>, 
                  empresa especializada em soluções tecnológicas inovadoras para educação digital.
                </p>
                <a 
                  href={platformData.developer.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--primary-color)',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <span>💻</span>
                  <span>Conheça a {platformData.developer.name}</span>
                </a>
              </div>
            </div>
            
            {/* Benefícios */}
            <div className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ 
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: 'var(--dark-color)'
              }}>
                Por que Escolher Nossa Plataforma?
              </h3>
              
              <div className="space-y-4">
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #ffffff 100%)',
                  border: '1px solid var(--primary-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                        Tecnologia de Ponta
                      </div>
                      <p style={{ color: 'var(--gray-color)', lineHeight: '1.6' }}>
                        Utilizamos as mais avançadas tecnologias web para oferecer performance excepcional e experiência de usuário impecável.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>💡</span>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                        Design Inovador
                      </div>
                      <p style={{ color: 'var(--gray-color)', lineHeight: '1.6' }}>
                        Interface moderna e intuitiva que encanta usuários, aumenta o engajamento e facilita o aprendizado.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #ffffff 100%)',
                  border: '1px solid var(--primary-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>🎧</span>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                        Suporte Dedicado
                      </div>
                      <p style={{ color: 'var(--gray-color)', lineHeight: '1.6' }}>
                        Equipe especializada pronta para oferecer suporte técnico e estratégico, garantindo o sucesso da sua operação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}