import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function StudentDashboard() {
  const { user, isStudent } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cursosMatriculados: 0,
    cursosConcluidos: 0,
    certificados: 0,
    progressoMedio: 0
  });
  const [cursosRecentes, setCursosRecentes] = useState([]);

  useEffect(() => {
    if (!isStudent) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, [isStudent]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do dashboard
      const [cursosRes, certificadosRes] = await Promise.all([
        api.get('/student/cursos'),
        api.get('/student/certificados').catch(() => ({ data: [] })) // Fallback se não existir
      ]);

      const cursosMatriculados = cursosRes.data.data?.matriculados || [];
      const cursosConcluidos = cursosMatriculados.filter(c => c.matricula?.status === 'concluida');
      
      
      // Calcular progresso médio
      let progressoTotal = 0;
      cursosMatriculados.forEach(curso => {
        progressoTotal += curso.progresso || 0;
      });

      // Calcular certificados
      const certificados = Array.isArray(certificadosRes.data) 
        ? certificadosRes.data.length 
        : (certificadosRes.data.certificados?.length || 0);

      setStats({
        cursosMatriculados: cursosMatriculados.length,
        cursosConcluidos: cursosConcluidos.length,
        certificados: certificados,
        progressoMedio: cursosMatriculados.length > 0 
          ? Math.round(progressoTotal / cursosMatriculados.length) 
          : 0
      });

      // Formatar cursos recentes para exibição
      const cursosFormatados = cursosMatriculados.slice(0, 3).map(item => ({
        id: item.curso.id,
        titulo: item.curso.titulo,
        descricao: item.curso.descricao,
        imagem_url: item.curso.imagem_url,
        instrutor_nome: item.curso.instrutor_nome,
        status_matricula: item.matricula.status,
        progresso: item.progresso,
        total_modulos: item.total_modulos,
        modulos_concluidos: item.modulos_concluidos,
        matricula_id: item.matricula.id
      }));
      
      setCursosRecentes(cursosFormatados);
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Fallback para dados vazios em caso de erro
      setStats({
        cursosMatriculados: 0,
        cursosConcluidos: 0,
        certificados: 0,
        progressoMedio: 0
      });
      setCursosRecentes([]);
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
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-12">
          {/* Header com saudação */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <div>
              <h1 className="mb-1">Bem-vindo, {user?.nome?.split(' ')[0] || 'Estudante'}!</h1>
              <p className="text-muted mb-0">Continue seu aprendizado e alcance seus objetivos</p>
            </div>
            <div className="mt-2 mt-md-0">
              <Link href="/cursos" className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>
                Encontrar Novo Curso
              </Link>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="row mb-5">
            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm bg-primary bg-gradient text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-subtitle mb-2 opacity-75">Cursos Matriculados</h6>
                      <h2 className="card-title mb-0">{stats.cursosMatriculados}</h2>
                    </div>
                    <i className="bi bi-book" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm bg-success bg-gradient text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-subtitle mb-2 opacity-75">Cursos Concluídos</h6>
                      <h2 className="card-title mb-0">{stats.cursosConcluidos}</h2>
                    </div>
                    <i className="bi bi-check-circle" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-subtitle mb-2 opacity-75">Certificados</h6>
                      <h2 className="card-title mb-0">{stats.certificados}</h2>
                    </div>
                    <i className="bi bi-award" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm bg-warning bg-gradient text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-subtitle mb-2 opacity-75">Progresso Médio</h6>
                      <h2 className="card-title mb-0">{stats.progressoMedio}%</h2>
                    </div>
                    <i className="bi bi-graph-up" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cursos Recentes */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-clock-history text-primary me-2"></i>
                Cursos em Andamento
              </h5>
              <Link href="/student/cursos" className="btn btn-outline-primary btn-sm">
                Ver Todos <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="card-body p-4">
              {cursosRecentes.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-muted mb-3">Nenhum curso matriculado</h4>
                  <p className="text-muted mb-4">
                    Você ainda não está matriculado em nenhum curso. Comece sua jornada de aprendizado!
                  </p>
                  <Link href="/student/cursos" className="btn btn-primary px-4">
                    <i className="bi bi-search me-2"></i>
                    Explorar Cursos
                  </Link>
                </div>
              ) : (
                <div className="row g-4">
                  {cursosRecentes.map(curso => {
                    const progresso = curso.progresso || 0;
                    const estaConcluido = curso.status_matricula === 'concluida';
                    
                    return (
                      <div key={curso.id} className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm hover-shadow">
                          <div className="position-relative">
                            {curso.imagem_url ? (
                              <img 
                                src={curso.imagem_url} 
                                className="card-img-top" 
                                alt={curso.titulo}
                                style={{ height: '160px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="card-img-top d-flex align-items-center justify-content-center bg-light"
                                style={{ height: '160px' }}
                              >
                                <i className="bi bi-book text-muted" style={{ fontSize: '3rem' }}></i>
                              </div>
                            )}
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className={`badge ${estaConcluido ? 'bg-success' : 'bg-primary'}`}>
                                {estaConcluido ? 'Concluído' : progresso === 0 ? 'Novo' : 'Em andamento'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="card-body">
                            <h5 className="card-title mb-2">{curso.titulo}</h5>
                            <p className="card-text text-muted small mb-3">
                              <i className="bi bi-person me-1"></i>
                              {curso.instrutor_nome}
                            </p>
                            
                            {/* Barra de Progresso */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <small className="text-muted">Progresso</small>
                                <small className="fw-bold">{progresso}%</small>
                              </div>
                              <div className="progress" style={{ height: '6px' }}>
                                <div 
                                  className={`progress-bar ${estaConcluido ? 'bg-success' : ''}`}
                                  role="progressbar" 
                                  style={{ width: `${progresso}%` }}
                                  aria-valuenow={progresso}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              {curso.total_modulos > 0 && (
                                <small className="text-muted">
                                  {curso.modulos_concluidos || 0} de {curso.total_modulos} módulos concluídos
                                </small>
                              )}
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              {estaConcluido ? (
                                <Link 
                                  href={`/student/certificados/${curso.matricula_id}`}
                                  className="btn btn-success btn-sm"
                                >
                                  <i className="bi bi-award me-1"></i>
                                  Ver Certificado
                                </Link>
                              ) : (
                                <Link 
                                  href={`/student/curso/${curso.id}`}
                                  className="btn btn-primary btn-sm"
                                >
                                  <i className="bi bi-play-circle me-1"></i>
                                  Continuar
                                </Link>
                              )}
                              <Link 
                                href={`/cursos/${curso.id}`}
                                className="btn btn-link btn-sm text-decoration-none"
                              >
                                Detalhes
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="row mb-5">
            <div className="col-md-6 col-lg-3 mb-3">
              <Link href="/student/cursos" className="card text-decoration-none border-0 shadow-sm h-100 hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                      <i className="bi bi-search text-primary" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <h5 className="card-title mb-2">Explorar Cursos</h5>
                  <p className="card-text text-muted small">
                    Descubra novos cursos para expandir seus conhecimentos
                  </p>
                </div>
              </Link>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-3">
              <Link href="/student/certificados" className="card text-decoration-none border-0 shadow-sm h-100 hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                      <i className="bi bi-award text-success" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <h5 className="card-title mb-2">Meus Certificados</h5>
                  <p className="card-text text-muted small">
                    Visualize e baixe seus certificados de conclusão
                  </p>
                </div>
              </Link>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-3">
              <Link href="/auth/perfil" className="card text-decoration-none border-0 shadow-sm h-100 hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                      <i className="bi bi-person text-info" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <h5 className="card-title mb-2">Meu Perfil</h5>
                  <p className="card-text text-muted small">
                    Atualize suas informações pessoais e preferências
                  </p>
                </div>
              </Link>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-3">
              <Link href="/student/ajuda" className="card text-decoration-none border-0 shadow-sm h-100 hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                      <i className="bi bi-question-circle text-warning" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <h5 className="card-title mb-2">Central de Ajuda</h5>
                  <p className="card-text text-muted small">
                    Tire suas dúvidas e encontre tutoriais
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Próximas Aulas (Placeholder) */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-calendar-check text-primary me-2"></i>
                Suas Atividades
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="text-center py-3">
                <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">
                  Você não tem atividades agendadas para hoje
                </p>
                <button className="btn btn-outline-primary mt-2">
                  <i className="bi bi-plus-circle me-2"></i>
                  Agendar Estudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}