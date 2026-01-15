import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function CursosInstrutor() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }
    fetchCursos();
  }, [isInstructor]);

  const fetchCursos = async () => {
    try {
      const response = await api.get('/instructor/courses');
      setCursos(response.data?.data);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Meus Cursos</h1>
            <Link href="/instructor/cursos/novo" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Novo Curso
            </Link>
          </div>

          <div className="card">
            <div className="card-body">
              {cursos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum curso encontrado</h4>
                  <p className="text-muted">Você ainda não criou nenhum curso</p>
                  <Link href="/instructor/cursos/novo" className="btn btn-primary">
                    Criar Primeiro Curso
                  </Link>
                </div>
              ) : (
                <div className="row">
                  {cursos.map(curso => (
                    <div key={curso.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100">
                        {curso.imagem_url && (
                          <img 
                            src={curso.imagem_url} 
                            className="card-img-top" 
                            alt={curso.titulo}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <div className="mb-2">
                            <span className={`badge bg-${curso.status === 'publicado' ? 'success' : 'warning'} me-2`}>
                              {curso.status}
                            </span>
                            <span className={`badge bg-${curso.gratuito ? 'success' : 'warning'}`}>
                              {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                            </span>
                          </div>
                          <h5 className="card-title">{curso.titulo}</h5>
                          <p className="card-text text-muted">
                            {curso.descricao?.substring(0, 100)}...
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted">
                                <i className="bi bi-people me-1"></i>
                                {curso.total_matriculas || 0} alunos
                              </small>
                            </div>
                            <Link 
                              href={`/instructor/cursos/${curso.id}`}
                              className="btn btn-sm btn-primary"
                            >
                              Gerenciar
                            </Link>
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
      </div>
    </div>
  );
}