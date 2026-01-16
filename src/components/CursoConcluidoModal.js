// components/CursoConcluidoModal.js
import React from 'react';
import Link from 'next/link';

export default function CursoConcluidoModal({ curso, onClose, certificadoGerado }) {
  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-award me-2"></i>
              Parabéns!
            </h5>
          </div>
          <div className="modal-body text-center py-4">
            <i className="bi bi-trophy text-success" style={{ fontSize: '4rem' }}></i>
            <h4 className="mt-3 mb-2">Curso Concluído com Sucesso!</h4>
            <p className="lead">{curso.titulo}</p>
            
            <div className="card mb-3">
              <div className="card-body text-start">
                <h6>Resumo do seu desempenho:</h6>
                <ul className="mb-0">
                  <li>✅ Todos os módulos completados</li>
                  <li>✅ Todos os quizzes aprovados</li>
                  <li>✅ Progresso 100% atingido</li>
                </ul>
              </div>
            </div>

            {certificadoGerado ? (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                Seu certificado foi emitido automaticamente!
              </div>
            ) : (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Seu instrutor emitirá seu certificado em breve.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Continuar Estudando
            </button>
            
            <Link 
              href="/student/certificados" 
              className="btn btn-success"
            >
              <i className="bi bi-award me-2"></i>
              Ver Certificados
            </Link>
            
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                // Lógica para compartilhar conquista
                if (navigator.share) {
                  navigator.share({
                    title: 'Concluí um curso!',
                    text: `Acabei de concluir o curso "${curso.titulo}"! 🎓`,
                    url: window.location.href
                  });
                }
              }}
            >
              <i className="bi bi-share me-2"></i>
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}