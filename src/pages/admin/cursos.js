import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function GerenciarCursos() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/auth/login');
      return;
    }
    fetchCursos();
  }, [isAdmin, filtroStatus]);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filtroStatus !== 'todos' ? filtroStatus : '',
        search: filtroBusca
      }).toString();
      
      const response = await api.get(`/admin/cursos?${params}`);
      //console.log(response.data.cursos);
      
      setCursos(response.data.cursos);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      setErro('Erro ao carregar cursos');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMudarStatus = async (cursoId, novoStatus) => {
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

  const handlePesquisar = (e) => {
    e.preventDefault();
    fetchCursos();
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
            <div>
              <h1 className="mb-1">Gerenciar Cursos</h1>
              <p className="text-muted mb-0">
                Gerencie todos os cursos da plataforma
              </p>
            </div>
            <Link href="/admin" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar
            </Link>
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

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <form onSubmit={handlePesquisar} className="d-flex">
                    <input
                      type="text"
                      className="form-control me-2"
                      placeholder="Buscar por título ou instrutor..."
                      value={filtroBusca}
                      onChange={(e) => setFiltroBusca(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-search"></i>
                    </button>
                  </form>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-end">
                    <select
                      className="form-select w-auto"
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <option value="todos">Todos os status</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="publicado">Publicado</option>
                      <option value="arquivado">Arquivado</option>
                    </select>
                    <button 
                      className="btn btn-outline-secondary ms-2"
                      onClick={() => {
                        setFiltroBusca('');
                        setFiltroStatus('todos');
                        fetchCursos();
                      }}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Cursos */}
          {cursos.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
              <h4 className="mt-3 mb-2">Nenhum curso encontrado</h4>
              <p className="text-muted">Não há cursos correspondentes aos filtros aplicados</p>
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
                    <div className="card-body d-flex flex-column">
                      <div className="mb-2">
                        <span className={`badge bg-${getStatusColor(curso.status)} me-2`}>
                          {curso.status}
                        </span>
                        <span className={`badge bg-${curso.gratuito ? 'success' : 'warning'}`}>
                          {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                        </span>
                      </div>
                      
                      <h5 className="card-title">{curso.titulo}</h5>
                      <p className="card-text flex-grow-1 text-muted">
                        {curso.descricao?.substring(0, 100)}...
                      </p>
                      
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {curso.instrutor_nome}
                          </small>
                          <small className="text-muted">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(curso.data_criacao).toLocaleDateString('pt-BR')}
                          </small>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-info me-1">
                              {curso.total_modulos} módulos
                            </span>
                            <span className="badge bg-primary">
                              {curso.total_matriculas} matrículas
                            </span>
                          </div>
                          
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              Ações
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <Link href={`/admin/cursos/${curso.id}`} className="dropdown-item">
                                  <i className="bi bi-eye me-2"></i>
                                  Ver detalhes
                                </Link>
                              </li>
                              <li>
                                <Link href={`/cursos/${curso.id}`} className="dropdown-item" target="_blank">
                                  <i className="bi bi-box-arrow-up-right me-2"></i>
                                  Ver curso
                                </Link>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              {curso.status !== 'publicado' && (
                                <li>
                                  <button 
                                    className="dropdown-item text-success"
                                    onClick={() => handleMudarStatus(curso.id, 'publicado')}
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
                                    onClick={() => handleMudarStatus(curso.id, 'arquivado')}
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
                                    onClick={() => handleMudarStatus(curso.id, 'rascunho')}
                                  >
                                    <i className="bi bi-pencil me-2"></i>
                                    Mover para rascunho
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Total Cursos</h5>
                  <h2>{cursos.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Publicados</h5>
                  <h2>{cursos.filter(c => c.status === 'publicado').length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Rascunhos</h5>
                  <h2>{cursos.filter(c => c.status === 'rascunho').length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-secondary text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Arquivados</h5>
                  <h2>{cursos.filter(c => c.status === 'arquivado').length}</h2>
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