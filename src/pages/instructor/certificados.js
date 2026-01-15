import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../lib/api';

export default function CertificadosInstrutor() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }
    fetchCertificados();
  }, [isInstructor]);

  const fetchCertificados = async () => {
    try {
      const response = await api.get('/api/instructor/certificados');
      setCertificados(response.data);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmitirCertificado = async (matriculaId) => {
    try {
      const response = await api.post('/api/instructor/certificados/emitir', {
        matricula_id: matriculaId
      });
      
      if (response.data.success) {
        alert('Certificado emitido com sucesso!');
        fetchCertificados();
      }
    } catch (error) {
      console.error('Erro ao emitir certificado:', error);
      alert(error.response?.data?.message || 'Erro ao emitir certificado');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Certificados Emitidos</h1>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Certificados dos Alunos</h5>
            </div>
            <div className="card-body">
              {certificados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-award text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum certificado emitido</h4>
                  <p className="text-muted">
                    Quando alunos completarem seus cursos, você poderá emitir certificados aqui
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Curso</th>
                        <th>Código</th>
                        <th>Data de Emissão</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificados.map(cert => (
                        <tr key={cert.id}>
                          <td>
                            <div>
                              <strong>{cert.estudante_nome}</strong>
                              <div className="text-muted small">{cert.estudante_email}</div>
                            </div>
                          </td>
                          <td>{cert.curso_titulo}</td>
                          <td>
                            <code>{cert.codigo_verificacao}</code>
                          </td>
                          <td>{new Date(cert.data_emissao).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => window.open(cert.url_pdf || '#', '_blank')}
                            >
                              <i className="bi bi-download me-1"></i>
                              Baixar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}