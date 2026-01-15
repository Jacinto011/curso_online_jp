import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../lib/api';

export default function DetalhesUsuario() {
  const { isAdmin, user: currentUser } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [matriculas, setMatriculas] = useState([]);
  const [cursosCriados, setCursosCriados] = useState([]);

  useEffect(() => {
    if (!isAdmin || !id) {
      router.push('/auth/login');
      return;
    }
    fetchUsuario();
    fetchDadosRelacionados();
  }, [isAdmin, id]);

  const fetchUsuario = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/usuarios/${id}`);
      //console.log(response.data.usuario);
      
      setUsuario(response.data.usuario);
      setFormData(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setErro('Erro ao carregar dados do usuário');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchDadosRelacionados = async () => {
    try {
      const [matRes, cursosRes] = await Promise.all([
        api.get(`/admin/usuarios/${id}/matriculas`),
        api.get(`/admin/usuarios/${id}/cursos`)
      ]);
      //console.log(matRes.data.matriculas);
      //console.log(cursosRes.data.cursos);
      
      setMatriculas(matRes.data.matriculas);
      setCursosCriados(cursosRes.data.cursos);
    } catch (error) {
      console.error('Erro ao buscar dados relacionados:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/usuarios/${id}`, formData);
      setSucesso('Usuário atualizado com sucesso');
      setUsuario(formData);
      setEditing(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao atualizar usuário');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleAtivarDesativar = async () => {
    if (!window.confirm(`Deseja ${usuario.ativo ? 'desativar' : 'ativar'} este usuário?`)) {
      return;
    }

    try {
      await api.put(`/admin/usuarios/${id}/status`, { ativo: !usuario.ativo });
      setSucesso(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso`);
      setUsuario({ ...usuario, ativo: !usuario.ativo });
      setFormData({ ...formData, ativo: !usuario.ativo });
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao atualizar status do usuário');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleMudarRole = async (novaRole) => {
    if (!window.confirm(`Deseja alterar o papel deste usuário para ${novaRole}?`)) {
      return;
    }

    try {
      await api.put(`/admin/usuarios/${id}/role`, { role: novaRole });
      setSucesso(`Papel do usuário alterado para ${novaRole}`);
      setUsuario({ ...usuario, role: novaRole });
      setFormData({ ...formData, role: novaRole });
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao alterar papel do usuário');
      setTimeout(() => setErro(''), 3000);
    }
  };

  if (loading || !usuario) {
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

  const isCurrentUser = parseInt(id) === currentUser.id;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Cabeçalho */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">
                {editing ? 'Editar Usuário' : `Usuário: ${usuario.nome}`}
              </h1>
              <p className="text-muted mb-0">
                ID: {usuario.id} • Email: {usuario.email}
              </p>
            </div>
            <div>
              <Link href="/admin/usuarios" className="btn btn-outline-primary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar
              </Link>
              {!editing && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                  disabled={isCurrentUser}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Editar
                </button>
              )}
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

          {editing ? (
            /* Formulário de Edição */
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Editar Usuário</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nome" className="form-label">Nome *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="nome"
                        name="nome"
                        value={formData.nome || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="telefone" className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="telefone"
                        name="telefone"
                        value={formData.telefone || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="role" className="form-label">Papel</label>
                      <select
                        className="form-select"
                        id="role"
                        name="role"
                        value={formData.role || 'student'}
                        onChange={handleChange}
                        disabled={isCurrentUser}
                      >
                        <option value="admin">Administrador</option>
                        <option value="instructor">Instrutor</option>
                        <option value="student">Estudante</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">Biografia</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows="4"
                      value={formData.bio || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ativo"
                      name="ativo"
                      checked={formData.ativo || false}
                      onChange={handleChange}
                      disabled={isCurrentUser}
                    />
                    <label className="form-check-label" htmlFor="ativo">
                      Usuário Ativo
                    </label>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEditing(false);
                        setFormData(usuario);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-save me-2"></i>
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Visualização dos Dados */
            <div className="row">
              {/* Informações do Usuário */}
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Informações do Usuário</h5>
                  </div>
                  <div className="card-body">
                    <div className="text-center mb-4">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                           style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <h4>{usuario.nome}</h4>
                      <p className="text-muted">{usuario.email}</p>
                    </div>

                    <div className="mb-3">
                      <h6>Status</h6>
                      <div className="d-flex justify-content-between">
                        <span className={`badge bg-${usuario.ativo ? 'success' : 'danger'}`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button 
                          className={`btn btn-sm btn-${usuario.ativo ? 'outline-danger' : 'outline-success'}`}
                          onClick={handleAtivarDesativar}
                          disabled={isCurrentUser}
                        >
                          {usuario.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6>Papel</h6>
                      <div className="d-flex justify-content-between">
                        <span className={`badge bg-${getRoleColor(usuario.role)}`}>
                          {getRoleLabel(usuario.role)}
                        </span>
                        {!isCurrentUser && (
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              Alterar
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleMudarRole('admin')}
                                >
                                  Administrador
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleMudarRole('instructor')}
                                >
                                  Instrutor
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleMudarRole('student')}
                                >
                                  Estudante
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6>Telefone</h6>
                      <p>{usuario.telefone || 'Não informado'}</p>
                    </div>

                    <div className="mb-3">
                      <h6>Data de Registro</h6>
                      <p>{new Date(usuario.data_criacao).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div>
                      <h6>Biografia</h6>
                      <p className="text-muted">{usuario.bio || 'Nenhuma biografia fornecida.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Relacionados */}
              <div className="col-md-8">
                {/* Matrículas do Usuário */}
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Matrículas</h5>
                    <span className="badge bg-primary">{matriculas.length} cursos</span>
                  </div>
                  <div className="card-body">
                    {matriculas.length === 0 ? (
                      <p className="text-muted text-center mb-0">Nenhuma matrícula encontrada</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Curso</th>
                              <th>Status</th>
                              <th>Data</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matriculas.map(mat => (
                              <tr key={mat.id}>
                                <td>{mat.curso_titulo}</td>
                                <td>
                                  <span className={`badge bg-${getMatriculaStatusColor(mat.status)}`}>
                                    {mat.status}
                                  </span>
                                </td>
                                <td>{new Date(mat.data_matricula).toLocaleDateString('pt-BR')}</td>
                                <td>
                                  <Link 
                                    href={`/cursos/${mat.curso_id}`}
                                    className="btn btn-sm btn-outline-primary"
                                    target="_blank"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cursos Criados (se for instrutor) */}
                {usuario.role === 'instructor' && (
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Cursos Criados</h5>
                      <span className="badge bg-success">{cursosCriados.length} cursos</span>
                    </div>
                    <div className="card-body">
                      {cursosCriados.length === 0 ? (
                        <p className="text-muted text-center mb-0">Nenhum curso criado</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Título</th>
                                <th>Status</th>
                                <th>Matrículas</th>
                                <th>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cursosCriados.map(curso => (
                                <tr key={curso.id}>
                                  <td>{curso.titulo}</td>
                                  <td>
                                    <span className={`badge bg-${getStatusColor(curso.status)}`}>
                                      {curso.status}
                                    </span>
                                  </td>
                                  <td>{curso.total_matriculas}</td>
                                  <td>
                                    <Link 
                                      href={`/cursos/${curso.id}`}
                                      className="btn btn-sm btn-outline-primary me-1"
                                      target="_blank"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </Link>
                                    <Link 
                                      href={`/admin/cursos/${curso.id}`}
                                      className="btn btn-sm btn-outline-secondary"
                                    >
                                      <i className="bi bi-gear"></i>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estatísticas */}
                <div className="row mt-4">
                  <div className="col-md-4">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h6>Total Matrículas</h6>
                        <h3>{matriculas.length}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h6>Cursos Concluídos</h6>
                        <h3>{matriculas.filter(m => m.status === 'concluida').length}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <h6>Cursos Criados</h6>
                        <h3>{cursosCriados.length}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares
function getRoleColor(role) {
  switch(role) {
    case 'admin': return 'danger';
    case 'instructor': return 'success';
    case 'student': return 'primary';
    default: return 'secondary';
  }
}

function getRoleLabel(role) {
  switch(role) {
    case 'admin': return 'Administrador';
    case 'instructor': return 'Instrutor';
    case 'student': return 'Estudante';
    default: return role;
  }
}

function getMatriculaStatusColor(status) {
  switch(status) {
    case 'ativa': return 'success';
    case 'concluida': return 'info';
    case 'pendente': return 'warning';
    case 'suspensa': return 'danger';
    default: return 'secondary';
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'publicado': return 'success';
    case 'rascunho': return 'warning';
    case 'arquivado': return 'secondary';
    default: return 'light';
  }
}