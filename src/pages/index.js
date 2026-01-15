import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container py-5 ">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">Plataforma de Cursos Online</h1>
        <p className="lead text-muted mb-4">
          Aprenda com os melhores instrutores e desenvolva suas habilidades
        </p>
        
        {!isAuthenticated ? (
          <div className="d-flex justify-content-center gap-3">
            <Link href="/auth/register" className="btn btn-primary btn-lg px-4">
              Começar Agora
            </Link>
            <Link href="/cursos" className="btn btn-outline-primary btn-lg px-4">
              Ver Cursos
            </Link>
          </div>
        ) : (
          <div className="d-flex justify-content-center gap-3">
            <Link 
              href={user?.role === 'student' ? '/student' : 
                     user?.role === 'instructor' ? '/instructor' : '/admin'}
              className="btn btn-primary btn-lg px-4"
            >
              Ir para Dashboard
            </Link>
            <Link href="/cursos" className="btn btn-outline-primary btn-lg px-4">
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>

      <div className="row mt-5">
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-people-fill text-primary" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Para Estudantes</h3>
              <p className="text-muted">
                Acesse cursos de alta qualidade, aprenda no seu ritmo e obtenha certificados reconhecidos.
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-person-badge-fill text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Para Instrutores</h3>
              <p className="text-muted">
                Crie e venda seus cursos, compartilhe conhecimento e alcance milhares de estudantes.
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-award-fill text-warning" style={{ fontSize: '3rem' }}></i>
              </div>
              <h3 className="h4 mb-3">Certificados</h3>
              <p className="text-muted">
                Receba certificados de conclusão validados para cada curso que você completar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Como Funciona</h2>
              <div className="row">
                <div className="col-md-3 text-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-search"></i>
                  </div>
                  <h5 className="mt-3">1. Escolha</h5>
                  <p>Encontre o curso ideal para você</p>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-cart-check"></i>
                  </div>
                  <h5 className="mt-3">2. Inscreva-se</h5>
                  <p>Matricule-se no curso</p>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-play-circle"></i>
                  </div>
                  <h5 className="mt-3">3. Aprenda</h5>
                  <p>Acesse as aulas e materiais</p>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-award"></i>
                  </div>
                  <h5 className="mt-3">4. Certifique</h5>
                  <p>Complete e receba seu certificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}