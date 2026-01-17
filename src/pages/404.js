import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Custom404() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6 text-center">
          {/* Ícone de erro */}
          <div className="mb-4">
            <i 
              className="bi bi-exclamation-triangle-fill text-danger" 
              style={{ fontSize: '5rem' }}
            ></i>
          </div>
          
          {/* Título 404 */}
          <h1 className="display-1 fw-bold text-muted mb-3">404</h1>
          
          {/* Mensagem de erro */}
          <h2 className="h1 mb-4">Página não encontrada</h2>
          
          <p className="lead text-muted mb-5">
            A página que você está procurando não existe ou foi movida.
            <br />
            Verifique o endereço digitado ou retorne à página inicial.
          </p>
          
          {/* Botões de ação */}
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link href="/" className="btn btn-primary btn-lg px-4">
              <i className="bi bi-house-door me-2"></i>
              Voltar para Home
            </Link>
            
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-outline-primary btn-lg px-4"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Voltar Anterior
            </button>
            
            {/* Dashboard baseado no papel do usuário */}
            {isAuthenticated && (
              <Link 
                href={
                  user?.role === 'student' ? '/student' : 
                  user?.role === 'instructor' ? '/instructor' : 
                  user?.role === 'admin' ? '/admin' : '/'
                }
                className="btn btn-success btn-lg px-4"
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Ir para Dashboard
              </Link>
            )}
          </div>
          
          {/* Links úteis */}
          <div className="mt-5 pt-4 border-top">
            <p className="text-muted mb-3">Ou explore outras páginas:</p>
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              <Link href="/cursos" className="text-decoration-none">
                <i className="bi bi-book me-1"></i>
                Cursos
              </Link>
              
              {!isAuthenticated && (
                <>
                  <Link href="/auth/login" className="text-decoration-none">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Login
                  </Link>
                  
                  <Link href="/auth/register" className="text-decoration-none">
                    <i className="bi bi-person-plus me-1"></i>
                    Registrar
                  </Link>
                </>
              )}
              
              <Link href="/sobre" className="text-decoration-none">
                <i className="bi bi-info-circle me-1"></i>
                Sobre
              </Link>
              
              <Link href="/contato" className="text-decoration-none">
                <i className="bi bi-envelope me-1"></i>
                Contato
              </Link>
            </div>
          </div>
          
          {/* Mensagem de ajuda */}
          <div className="mt-5">
            <div className="alert alert-light border">
              <h5 className="alert-heading">
                <i className="bi bi-question-circle me-2"></i>
                Precisa de ajuda?
              </h5>
              <p className="mb-0 small">
                Se você acredita que esta é uma página que deveria existir, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}