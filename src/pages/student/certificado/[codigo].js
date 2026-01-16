// pages/student/certificado/[codigo].js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../../lib/api';

export default function VisualizarCertificado() {
  const { user, isStudent, isInstructor } = useAuth();
  const router = useRouter();
  const { codigo } = router.query;
  const [certificado, setCertificado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (codigo && user) {
      verificarCertificado(codigo);
    }
  }, [codigo, user]);

  const verificarCertificado = async (codigo) => {
    try {
      setLoading(true);
      
      // Verifica qual endpoint usar baseado no tipo de usuário
      const endpoint = isStudent 
        ? `/student/certificado/verificar/${codigo}`
        : `/instructor/certificado/verificar/${codigo}`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setCertificado(response.data.data);
      } else {
        setError(response.data.message || 'Certificado não encontrado');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar certificado');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="text-center">
            <i className="bi bi-shield-lock text-warning" style={{ fontSize: '4rem' }}></i>
            <h3 className="mt-3">Acesso Restrito</h3>
            <p className="text-muted">Você precisa fazer login para acessar este certificado</p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/auth/login')}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando certificado...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h3 className="mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Acesso Negado</h3>
              </div>
              <div className="card-body text-center py-5">
                <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Não autorizado</h4>
                <p className="text-muted">{error}</p>
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => router.push(isStudent ? '/student/certificados' : '/instructor/dashboard')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">
                  <i className="bi bi-award me-2"></i>
                  Certificado de Conclusão
                </h3>
                <small>Código: {certificado.certificado.codigo}</small>
              </div>
              <div>
                <span className={`badge ${isStudent ? 'bg-success' : 'bg-warning'}`}>
                  {isStudent ? 'ESTUDANTE' : 'INSTRUTOR'}
                </span>
              </div>
            </div>
            
            <div className="card-body">
              {/* Visualizador do certificado */}
              <div className="row">
                <div className="col-md-8">
                  <div className="card border-success">
                    <div className="card-body text-center p-5">
                      <i className="bi bi-award text-success" style={{ fontSize: '3rem' }}></i>
                      <h2 className="mt-3">Certificado de Conclusão</h2>
                      <p className="text-muted">A plataforma de cursos online certifica que</p>
                      
                      <h3 className="text-primary my-4">{certificado.estudante.nome}</h3>
                      
                      <p className="text-muted">concluiu com sucesso o curso</p>
                      
                      <h4 className="text-success mb-4">"{certificado.curso.titulo}"</h4>
                      
                      <div className="row mt-4">
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-body">
                              <p><strong>Instrutor:</strong></p>
                              <h5>{certificado.instrutor.nome}</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-body">
                              <p><strong>Data de Conclusão:</strong></p>
                              <h5>{new Date(certificado.datas.conclusao).toLocaleDateString('pt-BR')}</h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Ações</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <a 
                          href={certificado.certificado.url_pdf}
                          className="btn btn-success"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bi bi-download me-2"></i>
                          Baixar PDF
                        </a>
                        
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(certificado.certificado.codigo);
                            alert('Código copiado!');
                          }}
                        >
                          <i className="bi bi-clipboard me-2"></i>
                          Copiar Código
                        </button>
                        
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => router.back()}
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Voltar
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <h6>Informações</h6>
                        <ul className="list-unstyled">
                          <li><strong>Emitido em:</strong> {new Date(certificado.datas.emissao).toLocaleDateString('pt-BR')}</li>
                          <li><strong>Matriculado em:</strong> {new Date(certificado.datas.matricula).toLocaleDateString('pt-BR')}</li>
                          <li><strong>Status:</strong> <span className="badge bg-success">VÁLIDO</span></li>
                        </ul>
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
  );
}