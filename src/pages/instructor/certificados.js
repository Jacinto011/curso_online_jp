// pages/instructor/certificados.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
      setLoading(true);
      const response = await api.get('/instructor/certificados');
      setCertificados(response.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Certificados dos Alunos</h1>
          <p className="text-muted">Certificados emitidos para seus alunos</p>
        </div>
      </div>
      
      {certificados.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-award text-muted" style={{ fontSize: '4rem' }}></i>
            <h4 className="mt-3 mb-2">Nenhum certificado encontrado</h4>
            <p className="text-muted">
              Seus alunos ainda não completaram nenhum curso.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Curso</th>
                    <th>Data de Conclusão</th>
                    <th>Data de Emissão</th>
                    <th>Código</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {certificados.map(cert => (
                    <tr key={cert.id}>
                      <td>
                        <strong>{cert.estudante_nome}</strong>
                        <br />
                        <small className="text-muted">{cert.estudante_email}</small>
                      </td>
                      <td>{cert.curso_titulo}</td>
                      <td>{new Date(cert.data_conclusao).toLocaleDateString('pt-BR')}</td>
                      <td>{new Date(cert.data_emissao).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <code className="bg-light p-1 rounded">{cert.codigo_verificacao.substring(0, 15)}...</code>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link 
                            href={`/instructor/certificado/${cert.codigo_verificacao}`}
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <a 
                            href={cert.url_pdf}
                            className="btn btn-outline-success"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-download"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}