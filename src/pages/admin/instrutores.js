import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function AprovarInstrutores() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [instrutores, setInstrutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('pendentes');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isAdmin, abaAtiva]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      
      if (abaAtiva === 'pendentes') {
        const response = await api.get('/admin/pedidos-instrutor?status=pendente');
        //console.log('pedidos, ',response.data);
        
        setPedidos(response.data.pedidos);
      } else {
        const response = await api.get('/admin/instrutores');
       // console.log('instrutore', response.data.instrutores);
        
        setInstrutores(response.data.instrutores);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro('Erro ao carregar dados');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarRejeitar = async (pedidoId, acao) => {
    try {
      await api.put(`/admin/pedidos-instrutor/${pedidoId}`, { acao });
      
      setSucesso(`Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso`);
      
      // Atualizar lista
      setPedidos(pedidos.filter(p => p.id !== pedidoId));
      
      if (acao === 'aprovar') {
        // Atualizar lista de instrutores também
        fetchDados();
      }
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro(`Erro ao ${acao} pedido`);
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleRemoverInstrutor = async (usuarioId) => {
    if (!window.confirm('Tem certeza que deseja remover este instrutor? Ele perderá acesso a todas as funcionalidades de instrutor.')) {
      return;
    }

    try {
      await api.put(`/admin/instrutores/${usuarioId}/remover`);
      setSucesso('Instrutor removido com sucesso');
      
      // Atualizar lista
      setInstrutores(instrutores.filter(i => i.id !== usuarioId));
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao remover instrutor');
      setTimeout(() => setErro(''), 3000);
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
            <div>
              <h1 className="mb-1">Gerenciar Instrutores</h1>
              <p className="text-muted mb-0">
                Aprove pedidos e gerencie instrutores da plataforma
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

          {/* Abas */}
          <div className="card mb-4">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${abaAtiva === 'pendentes' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('pendentes')}
                  >
                    <i className="bi bi-clock-history me-2"></i>
                    Pedidos Pendentes
                    {pedidos.length > 0 && (
                      <span className="badge bg-danger ms-2">{pedidos.length}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${abaAtiva === 'aprovados' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('aprovados')}
                  >
                    <i className="bi bi-person-check me-2"></i>
                    Instrutores Aprovados
                    <span className="badge bg-success ms-2">{instrutores.length}</span>
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="card-body">
              {abaAtiva === 'pendentes' ? (
                // Lista de pedidos pendentes
                pedidos.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle text-muted" style={{ fontSize: '4rem' }}></i>
                    <h4 className="mt-3 mb-2">Nenhum pedido pendente</h4>
                    <p className="text-muted">Todos os pedidos foram processados</p>
                  </div>
                ) : (
                  <div className="row">
                    {pedidos.map(pedido => (
                      <div key={pedido.id} className="col-md-6 mb-3">
                        <div className="card border-warning">
                          <div className="card-header bg-warning bg-opacity-25 d-flex justify-content-between align-items-center">
                            <strong>Solicitação #{pedido.id}</strong>
                            <small className="text-muted">
                              {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}
                            </small>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <h6 className="mb-1">Usuário:</h6>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                     style={{ width: '40px', height: '40px' }}>
                                  {pedido.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong>{pedido.nome}</strong>
                                  <div className="text-muted small">{pedido.email}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h6 className="mb-1">Mensagem do solicitante:</h6>
                              <p className="mb-0 text-muted">
                                {pedido.mensagem || 'Nenhuma mensagem fornecida.'}
                              </p>
                            </div>
                            
                            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                              <button
                                className="btn btn-success"
                                onClick={() => handleAprovarRejeitar(pedido.id, 'aprovar')}
                              >
                                <i className="bi bi-check-circle me-2"></i>
                                Aprovar
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleAprovarRejeitar(pedido.id, 'rejeitar')}
                              >
                                <i className="bi bi-x-circle me-2"></i>
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Lista de instrutores aprovados
                instrutores.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-person-x text-muted" style={{ fontSize: '4rem' }}></i>
                    <h4 className="mt-3 mb-2">Nenhum instrutor encontrado</h4>
                    <p className="text-muted">Nenhum instrutor foi aprovado ainda</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nome</th>
                          <th>Email</th>
                          <th>Data de Aprovação</th>
                          <th>Cursos Criados</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instrutores.map(instrutor => (
                          <tr key={instrutor.id}>
                            <td>{instrutor.id}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-2"
                                     style={{ width: '36px', height: '36px' }}>
                                  {instrutor.nome.charAt(0).toUpperCase()}
                                </div>
                                {instrutor.nome}
                              </div>
                            </td>
                            <td>{instrutor.email}</td>
                            <td>
                              {instrutor.data_aprovacao 
                                ? new Date(instrutor.data_aprovacao).toLocaleDateString('pt-BR')
                                : 'N/A'
                              }
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {instrutor.total_cursos || 0} cursos
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${instrutor.ativo ? 'success' : 'danger'}`}>
                                {instrutor.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group">
                                <Link
                                  href={`/admin/usuarios/${instrutor.id}`}
                                  className="btn btn-outline-primary"
                                  title="Ver perfil"
                                >
                                  <i className="bi bi-eye"></i>
                                </Link>
                                <Link
                                  href={`/admin/instrutores/${instrutor.id}/cursos`}
                                  className="btn btn-outline-info"
                                  title="Ver cursos"
                                >
                                  <i className="bi bi-book"></i>
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  title="Remover instrutor"
                                  onClick={() => handleRemoverInstrutor(instrutor.id)}
                                >
                                  <i className="bi bi-person-dash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="row">
            <div className="col-md-4">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Pedidos Pendentes</h5>
                  <h2>{pedidos.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Instrutores Aprovados</h5>
                  <h2>{instrutores.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Total Cursos</h5>
                  <h2>{instrutores.reduce((total, i) => total + (i.total_cursos || 0), 0)}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}