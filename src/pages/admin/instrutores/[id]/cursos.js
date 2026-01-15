import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function CursosInstrutor() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [instrutor, setInstrutor] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isAdmin || !id) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isAdmin, id, filtroStatus]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [instrutorRes, cursosRes] = await Promise.all([
        api.get(`/admin/instrutores/${id}`),
        api.get(`/admin/instrutores/${id}/cursos?status=${filtroStatus !== 'todos' ? filtroStatus : ''}`)
      ]);
      setInstrutor(instrutorRes.data);
      setCursos(cursosRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro('Erro ao carregar dados');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMudarStatusCurso = async (cursoId, novoStatus) => {
    try {
      await api.put(`/admin/cursos/${cursoId}/status`, { status: novoStatus });
      setSucesso(`Status do curso alterado para ${novoStatus}`);
      
      // Atualizar lista
      setCursos(cursos.map(c => 
        c.id === cursoId ? { ...c, status: novoStatus } : c
      ));
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao alterar status do curso');
      setTimeout(() => setErro(''), 3000);
    }
  };

  if (loading || !instrutor) {
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
          {/* Cabeçalho */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">Cursos do Instrutor</h1>
              <p className="text-muted mb-0">
                {instrutor.nome} • {instrutor.email}
              </p>
            </div>
            <div>
              <Link href={`/admin/usuarios/${id}`} className="btn btn-outline-primary me-2">
                <i className="bi bi-person me-2"></i>
                Ver Perfil
              </Link>
              <Link href="/admin/instrutores" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar
              </Link>
            </div>
          </div>

          {/* Mensagens */}
          {sucesso && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {sucesso}
              <button type="button" className="btn-close" onClick={() => setSucesso('')}></button>
            </div>
          )}
          
          {erro && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {erro}
              <button type="button" className="btn-close" onClick={() => setErro('')}></button>
            </div>
          )}

          {/* Estatísticas do Instrutor */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h6>Total de Cursos</h6>
                  <h3>{cursos.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h6>Publicados</h6>
                  <h3>{cursos.filter(c => c.status === 'publicado').length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h6>Rascunhos</h6>
                  <h3>{cursos.filter(c => c.status === 'rascunho').length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h6>Total Matrículas</h6>
                  <h3>{cursos.reduce((total, curso) => total + (curso.total_matriculas || 0), 0)}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <label htmlFor="filtroStatus" className="form-label">Filtrar por Status</label>
                  <select
                    className="form-select"
                    id="filtroStatus"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="todos">Todos os status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="form-check form-switch mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="apenasGratuitos"
                      onChange={() => {}}
                    />
                    <label className="form-check-label" htmlFor="apenasGratuitos">
                      Apenas cursos gratuitos
                    </label>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <button 
                    className="btn btn-outline-primary mt-3"
                    onClick={fetchDados}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Cursos */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Cursos Criados</h5>
            </div>
            <div className="card-body p-0">
              {cursos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum curso encontrado</h4>
                  <p className="text-muted">Este instrutor ainda não criou nenhum curso</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Preço</th>
                        <th>Status</th>
                        <th>Matrículas</th>
                        <th>Módulos</th>
                        <th>Data de Criação</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cursos.map(curso => (
                        <tr key={curso.id}>
                          <td>{curso.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {curso.imagem_url && (
                                <img 
                                  src={curso.imagem_url} 
                                  alt={curso.titulo}
                                  className="rounded me-2"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <strong>{curso.titulo}</strong>
                                {curso.descricao && (
                                  <div className="text-muted small">
                                    {curso.descricao.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {curso.gratuito ? (
                              <span className="badge bg-success">Grátis</span>
                            ) : (
                              <span className="badge bg-warning">
                                MZN {parseFloat(curso.preco).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusColor(curso.status)}`}>
                              {curso.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {curso.total_matriculas || 0}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {curso.total_modulos || 0}
                            </span>
                          </td>
                          <td>
                            {new Date(curso.data_criacao).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <Link
                                href={`/cursos/${curso.id}`}
                                className="btn btn-outline-primary"
                                title="Ver curso"
                                target="_blank"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              
                              <div className="dropdown">
                                <button 
                                  className="btn btn-outline-secondary dropdown-toggle"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  title="Alterar status"
                                >
                                  <i className="bi bi-gear"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {curso.status !== 'publicado' && (
                                    <li>
                                      <button 
                                        className="dropdown-item text-success"
                                        onClick={() => handleMudarStatusCurso(curso.id, 'publicado')}
                                      >
                                        <i className="bi bi-check-circle me-2"></i>
                                        Publicar
                                      </button>
                                    </li>
                                  )}
                                  {curso.status !== 'arquivado' && (
                                    <li>
                                      <button 
                                        className="dropdown-item text-warning"
                                        onClick={() => handleMudarStatusCurso(curso.id, 'arquivado')}
                                      >
                                        <i className="bi bi-archive me-2"></i>
                                        Arquivar
                                      </button>
                                    </li>
                                  )}
                                  {curso.status !== 'rascunho' && (
                                    <li>
                                      <button 
                                        className="dropdown-item text-secondary"
                                        onClick={() => handleMudarStatusCurso(curso.id, 'rascunho')}
                                      >
                                        <i className="bi bi-pencil me-2"></i>
                                        Mover para rascunho
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Informações do Instrutor no rodapé */}
            <div className="card-footer">
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted">
                    <i className="bi bi-person me-1"></i>
                    Instrutor: <strong>{instrutor.nome}</strong> • {instrutor.email}
                  </small>
                </div>
                <div className="col-md-6 text-end">
                  <small className="text-muted">
                    Total de cursos exibidos: <strong>{cursos.length}</strong>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  switch(status) {
    case 'publicado': return 'success';
    case 'rascunho': return 'warning';
    case 'arquivado': return 'secondary';
    default: return 'light';
  }
}