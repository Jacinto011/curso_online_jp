import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Link from 'next/link';

export default function CertificadosEstudante() {
  const { isStudent } = useAuth();
  const router = useRouter();
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStudent) {
      router.push('/auth/login');
      return;
    }
    fetchCertificados();
  }, [isStudent]);

  const fetchCertificados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/certificados');
      setCertificados(response.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado para a área de transferência!`);
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Meus Certificados</h1>

          {certificados.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-award text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3 mb-2">Nenhum certificado encontrado</h4>
                <p className="text-muted">
                  Você ainda não possui certificados. Complete cursos para receber certificados.
                </p>
              </div>
            </div>
          ) : (
            <div className="row">
              {certificados.map(cert => (
                <div key={cert.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">Certificado de Conclusão</h5>
                    </div>
                    <div className="card-body text-center">
                      <i className="bi bi-award text-success" style={{ fontSize: '4rem' }}></i>
                      <h4 className="mt-3">{cert.curso_titulo}</h4>
                      <p className="text-muted">Concluído com sucesso</p>

                      <div className="text-start">
                        <p><strong>Instrutor:</strong> {cert.instrutor_nome}</p>
                        <p><strong>Data de Conclusão:</strong> {new Date(cert.data_conclusao).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Data de Emissão:</strong> {new Date(cert.data_emissao).toLocaleDateString('pt-BR')}</p>
                        <p>
                          <strong>Código de Verificação:</strong>
                          <br />
                          <code className="bg-light p-2 rounded d-block mt-1">{cert.codigo_verificacao}</code>
                        </p>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <div className="d-grid gap-2">
                        <Link
                          href={`/student/certificado/${cert.codigo_verificacao}`}
                          className="btn btn-success"
                        >
                          <i className="bi bi-eye me-2"></i>
                          Ver Certificado
                        </Link>
                        {cert.url_pdf && (
                          <a
                            href={cert.url_pdf}
                            className="btn btn-success"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-download me-2"></i>
                            Baixar Certificado
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}