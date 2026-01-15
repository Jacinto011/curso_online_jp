import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function GerenciarUsuarios() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/auth/login');
      return;
    }
    fetchUsuarios();
  }, [isAdmin, paginaAtual, filtroRole]);

  const fetchUsuarios = async () => {
  try {
    setLoading(true);
    
    const params = new URLSearchParams({
      page: paginaAtual,
      limit: 20,
      role: filtroRole !== 'todos' ? filtroRole : '',
      search: filtro
    }).toString();
    
    //console.log('Buscando usuários com params:', params); // Debug
    
    const response = await api.get(`/admin/usuarios?${params}`);
    //console.log('Resposta da API:', response.data.data.usuarios); // Debug
    
    setUsuarios(response.data.data.usuarios || []);
    setTotalPaginas(response.data.totalPaginas || 1);
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    setErro('Erro ao carregar usuários');
    setUsuarios([]);
  } finally {
    setLoading(false);
  }
};

  

  const handleAtivarDesativar = async (usuarioId, ativo) => {
    try {
      await api.put(`/admin/usuarios/${usuarioId}/status`, { ativo: !ativo });
      setSucesso(`Usuário ${ativo ? 'desativado' : 'ativado'} com sucesso`);
      
      // Atualizar lista
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, ativo: !ativo } : u
      ));
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao atualizar status do usuário');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleMudarRole = async (usuarioId, novaRole) => {
    if (!window.confirm(`Deseja alterar o papel deste usuário para ${novaRole}?`)) {
      return;
    }

    try {
      await api.put(`/admin/usuarios/${usuarioId}/role`, { role: novaRole });
      setSucesso(`Papel do usuário alterado para ${novaRole}`);
      
      // Atualizar lista
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, role: novaRole } : u
      ));
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao alterar papel do usuário');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handlePesquisar = (e) => {
    e.preventDefault();
    setPaginaAtual(1);
    fetchUsuarios();
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
              <h1 className="mb-1">Gerenciar Usuários</h1>
              <p className="text-muted mb-0">
                Gerencie todos os usuários da plataforma
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
              <form onSubmit={handlePesquisar}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="filtro" className="form-label">Pesquisar</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        id="filtro"
                        placeholder="Nome ou email..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-search"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label htmlFor="filtroRole" className="form-label">Filtrar por Papel</label>
                    <select
                      className="form-select"
                      id="filtroRole"
                      value={filtroRole}
                      onChange={(e) => setFiltroRole(e.target.value)}
                    >
                      <option value="todos">Todos os papéis</option>
                      <option value="admin">Administrador</option>
                      <option value="instructor">Instrutor</option>
                      <option value="student">Estudante</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2 mb-3 d-flex align-items-end">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setFiltro('');
                        setFiltroRole('todos');
                        setPaginaAtual(1);
                      }}
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Total de Usuários: {usuarios.length}
              </h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={fetchUsuarios}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Atualizar
              </button>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Papel</th>
                      <th>Status</th>
                      <th>Data de Registro</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                          <p className="text-muted mt-2 mb-0">Nenhum usuário encontrado</p>
                        </td>
                      </tr>
                    ) : (
                      usuarios.map(usuario => (
                        <tr key={usuario.id}>
                          <td>{usuario.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                   style={{ width: '36px', height: '36px' }}>
                                {usuario.nome.charAt(0).toUpperCase()}
                              </div>
                              {usuario.nome}
                            </div>
                          </td>
                          <td>{usuario.email}</td>
                          <td>
                            <span className={`badge bg-${getRoleColor(usuario.role)}`}>
                              {getRoleLabel(usuario.role)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${usuario.ativo ? 'success' : 'danger'}`}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            {new Date(usuario.data_criacao).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <Link 
                                href={`/admin/usuarios/${usuario.id}`}
                                className="btn btn-outline-primary"
                                title="Ver detalhes"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              
                              <button
                                type="button"
                                className="btn btn-outline-warning"
                                title="Alterar papel"
                                onClick={() => {
                                  const novaRole = prompt(
                                    'Novo papel do usuário (admin/instructor/student):',
                                    usuario.role
                                  );
                                  if (novaRole && ['admin', 'instructor', 'student'].includes(novaRole)) {
                                    handleMudarRole(usuario.id, novaRole);
                                  }
                                }}
                              >
                                <i className="bi bi-person-badge"></i>
                              </button>
                              
                              <button
                                type="button"
                                className={`btn btn-${usuario.ativo ? 'outline-danger' : 'outline-success'}`}
                                title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                                onClick={() => handleAtivarDesativar(usuario.id, usuario.ativo)}
                              >
                                <i className={`bi bi-${usuario.ativo ? 'x-circle' : 'check-circle'}`}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="card-footer">
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${paginaAtual === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setPaginaAtual(paginaAtual - 1)}
                        disabled={paginaAtual === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    
                    {[...Array(totalPaginas)].map((_, index) => (
                      <li 
                        key={index + 1} 
                        className={`page-item ${paginaAtual === index + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link"
                          onClick={() => setPaginaAtual(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setPaginaAtual(paginaAtual + 1)}
                        disabled={paginaAtual === totalPaginas}
                      >
                        Próxima
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          {/* Estatísticas Rápidas */}
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Total Usuários</h5>
                  <h2>{usuarios.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Ativos</h5>
                  <h2>{usuarios.filter(u => u.ativo).length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Instrutores</h5>
                  <h2>{usuarios.filter(u => u.role === 'instructor').length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Estudantes</h5>
                  <h2>{usuarios.filter(u => u.role === 'student').length}</h2>
                </div>
              </div>
            </div>
          </div>
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