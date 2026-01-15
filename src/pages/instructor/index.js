import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import InstructorSidebar from '../../components/instructor/InstructorSidebar';

export default function InstructorDashboard() {
  const { user, isInstructor } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCursos: 0,
    cursosPublicados: 0,
    totalMatriculas: 0,
    matriculasPendentes: 0
  });

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }

    fetchDashboardData();
  }, [isInstructor]);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const [cursosRes, statsRes] = await Promise.all([
      api.get('instructor/courses'),
      api.get('instructor/stats')
    ]);
    
    // Ajuste aqui: statsRes.data já é o objeto com { success: true, data: {...} }
    // Então precisamos acessar statsRes.data.data
    //console.log('CURSO',cursosRes.data);
    
    setCursos(cursosRes.data?.data || []);
    setStats(statsRes.data?.data || {  // ← AQUI ESTÁ O AJUSTE
      totalCursos: 0,
      cursosPublicados: 0,
      totalMatriculas: 0,
      matriculasPendentes: 0
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    if (error.response?.status === 401) {
      router.push('/auth/login');
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3 col-lg-2">
            <InstructorSidebar />
          </div>
          <div className="col-md-9 col-lg-10 d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2">
          <InstructorSidebar />
        </div>
        
        <div className="col-md-9 col-lg-10">
          <div className="p-4">
            <h1 className="mb-4">Dashboard do Instrutor</h1>
            
            {/* Estatísticas */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5 className="card-title">Total de Cursos</h5>
                    <h2>{stats.totalCursos}</h2>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5 className="card-title">Cursos Publicados</h5>
                    <h2>{stats.cursosPublicados}</h2>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h5 className="card-title">Total de Matrículas</h5>
                    <h2>{stats.totalMatriculas}</h2>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <h5 className="card-title">Matrículas Pendentes</h5>
                    <h2>{stats.matriculasPendentes}</h2>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cursos Recentes */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Meus Cursos</h5>
                <Link href="/instructor/cursos/novo" className="btn btn-primary btn-sm">
                  <i className="bi bi-plus-circle me-1"></i> Novo Curso
                </Link>
              </div>
              <div className="card-body">
                {cursos.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-book text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">Você ainda não criou nenhum curso.</p>
                    <Link href="/instructor/cursos/novo" className="btn btn-primary">
                      Criar Primeiro Curso
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Status</th>
                          <th>Preço</th>
                          <th>Matrículas</th>
                          <th>Data</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cursos.slice(0, 5).map(curso => (
                          <tr key={curso.id}>
                            <td>{curso.titulo}</td>
                            <td>
                              <span className={`badge bg-${curso.status === 'publicado' ? 'success' : 'warning'}`}>
                                {curso.status}
                              </span>
                            </td>
                            <td>
                              {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                            </td>
                            <td>{curso.total_matriculas || 0}</td>
                            <td>{new Date(curso.data_criacao).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <Link 
                                href={`/instructor/cursos/${curso.id}`}
                                className="btn btn-sm btn-outline-primary me-1"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              <Link 
                                href={`/instructor/cursos/${curso.id}/editar`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card-footer text-end">
                <Link href="/instructor/cursos" className="btn btn-link">
                  Ver todos os cursos
                </Link>
              </div>
            </div>

            {/* Matrículas Pendentes */}
            {stats.matriculasPendentes > 0 && (
              <div className="card mt-4">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Matrículas Pendentes de Aprovação
                  </h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-warning">
                    <i className="bi bi-info-circle me-2"></i>
                    Você tem {stats.matriculasPendentes} matrícula(s) pendente(s) de aprovação.
                  </div>
                  <div className="text-end">
                    <Link href="/instructor/matriculas" className="btn btn-warning">
                      <i className="bi bi-people me-2"></i>
                      Gerenciar Matrículas
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="row mt-4">
              <div className="col-md-4 mb-3">
                <Link href="/instructor/cursos" className="card text-decoration-none">
                  <div className="card-body text-center">
                    <i className="bi bi-book text-primary" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mt-2 mb-0">Gerenciar Cursos</h5>
                  </div>
                </Link>
              </div>
              <div className="col-md-4 mb-3">
                <Link href="/instructor/matriculas" className="card text-decoration-none">
                  <div className="card-body text-center">
                    <i className="bi bi-people text-success" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mt-2 mb-0">Matrículas</h5>
                  </div>
                </Link>
              </div>
              <div className="col-md-4 mb-3">
                <Link href="/instructor/certificados" className="card text-decoration-none">
                  <div className="card-body text-center">
                    <i className="bi bi-award text-warning" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mt-2 mb-0">Certificados</h5>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}