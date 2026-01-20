import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import Link from 'next/link';

export default function AdminPagamentos() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pagamentos');
  const [filtros, setFiltros] = useState({
    status: '',
    metodo: '',
    data_inicio: '',
    data_fim: '',
    search: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    carregarDados();
  }, [isAuthenticated, user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [pagamentosRes, auditoriaRes] = await Promise.all([
        api.get('/admin/pagamentos'),
        api.get('/admin/auditoria')
      ]);
      setPagamentos(pagamentosRes.data.data || []);
      setAuditoria(auditoriaRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarPagamentos = () => {
    return pagamentos.filter(pagamento => {
      if (filtros.status && pagamento.status !== filtros.status) return false;
      if (filtros.metodo && pagamento.metodo_pagamento_id !== filtros.metodo) return false;
      if (filtros.search) {
        const searchLower = filtros.search.toLowerCase();
        return (
          pagamento.codigo_transacao?.toLowerCase().includes(searchLower) ||
          pagamento.estudante_nome?.toLowerCase().includes(searchLower) ||
          pagamento.curso_titulo?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  const atualizarStatusPagamento = async (pagamentoId, novoStatus) => {
    if (!confirm(`Tem certeza que deseja alterar o status para ${novoStatus}?`)) return;

    try {
      await api.put(`/admin/pagamentos/${pagamentoId}/status`, { status: novoStatus });
      alert('Status atualizado com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const formatarValor = (valor) => {
    return `MZN ${parseFloat(valor).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pendente': { class: 'warning', text: 'Pendente' },
      'pago': { class: 'success', text: 'Aprovado' },
      'rejeitado': { class: 'danger', text: 'Rejeitado' },
      'processando': { class: 'info', text: 'Processando' },
      'cancelado': { class: 'secondary', text: 'Cancelado' }
    };
    
    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return (
      <span className={`badge bg-${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getTipoAcaoBadge = (tipo) => {
    const tipoMap = {
      'login': 'primary',
      'logout': 'secondary',
      'pagamento': 'success',
      'cadastro': 'info',
      'alteracao': 'warning',
      'exclusao': 'danger',
      'sistema': 'dark'
    };
    return <span className={`badge bg-${tipoMap[tipo] || 'secondary'}`}>{tipo}</span>;
  };

  const getMesesStats = () => {
    const stats = {};
    pagamentos.forEach(p => {
      const mes = new Date(p.data_pagamento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!stats[mes]) {
        stats[mes] = { total: 0, aprovados: 0, pendentes: 0 };
      }
      stats[mes].total += parseFloat(p.valor);
      if (p.status === 'pago') stats[mes].aprovados += parseFloat(p.valor);
      if (p.status === 'pendente') stats[mes].pendentes += parseFloat(p.valor);
    });
    return stats;
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

  const pagamentosFiltrados = filtrarPagamentos();
  const stats = getMesesStats();

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Administração de Pagamentos</h1>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={carregarDados}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Atualizar
              </button>
              <button className="btn btn-success" onClick={() => window.print()}>
                <i className="bi bi-printer me-2"></i>
                Relatório
              </button>
            </div>
          </div>

          {/* Estatísticas Gerais */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Recebido
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {formatarValor(
                          pagamentos
                            .filter(p => p.status === 'pago')
                            .reduce((total, p) => total + parseFloat(p.valor), 0)
                        )}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-cash-coin fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Pagamentos Aprovados
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {pagamentos.filter(p => p.status === 'pago').length}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-warning shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Pagamentos Pendentes
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {pagamentos.filter(p => p.status === 'pendente').length}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-clock fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-danger shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                        Pagamentos Rejeitados
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {pagamentos.filter(p => p.status === 'rejeitado').length}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-x-circle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card mb-4">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'pagamentos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pagamentos')}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    Pagamentos ({pagamentos.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'auditoria' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auditoria')}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    Auditoria ({auditoria.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'estatisticas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('estatisticas')}
                  >
                    <i className="bi bi-bar-chart me-2"></i>
                    Estatísticas
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* Conteúdo da Tab Pagamentos */}
              {activeTab === 'pagamentos' && (
                <>
                  {/* Filtros */}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={filtros.status}
                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                      >
                        <option value="">Todos os Status</option>
                        <option value="pendente">Pendentes</option>
                        <option value="pago">Aprovados</option>
                        <option value="rejeitado">Rejeitados</option>
                        <option value="processando">Processando</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por código, aluno ou curso..."
                        value={filtros.search}
                        onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Data início"
                        value={filtros.data_inicio}
                        onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Data fim"
                        value={filtros.data_fim}
                        onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Tabela de Pagamentos */}
                  <div className="table-responsive">
                    <table className="table table-hover table-striped">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Estudante</th>
                          <th>Curso</th>
                          <th>Valor</th>
                          <th>Método</th>
                          <th>Data</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentosFiltrados.map(pagamento => (
                          <tr key={pagamento.id}>
                            <td>
                              <code className="small">{pagamento.codigo_transacao}</code>
                            </td>
                            <td>
                              <div>
                                <strong>{pagamento.estudante_nome}</strong>
                                <div className="text-muted small">{pagamento.estudante_email}</div>
                              </div>
                            </td>
                            <td>{pagamento.curso_titulo}</td>
                            <td>
                              <strong className="text-success">{formatarValor(pagamento.valor)}</strong>
                            </td>
                            <td>{pagamento.metodo_pagamento_nome || 'Transferência'}</td>
                            <td>
                              {new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td>{getStatusBadge(pagamento.status)}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                                  title="Ver comprovante"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                
                                {pagamento.status === 'pendente' && (
                                  <>
                                    <button
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => atualizarStatusPagamento(pagamento.id, 'pago')}
                                      title="Aprovar pagamento"
                                    >
                                      <i className="bi bi-check"></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => atualizarStatusPagamento(pagamento.id, 'rejeitado')}
                                      title="Rejeitar pagamento"
                                    >
                                      <i className="bi bi-x"></i>
                                    </button>
                                  </>
                                )}
                                
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => router.push(`/admin/pagamentos/${pagamento.id}`)}
                                  title="Ver detalhes"
                                >
                                  <i className="bi bi-info-circle"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {pagamentosFiltrados.length === 0 && (
                      <div className="text-center py-5">
                        <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mt-3">Nenhum pagamento encontrado</h5>
                        <p className="text-muted">Tente ajustar os filtros de busca</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Conteúdo da Tab Auditoria */}
              {activeTab === 'auditoria' && (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Data/Hora</th>
                          <th>Usuário</th>
                          <th>Tipo</th>
                          <th>Ação</th>
                          <th>IP</th>
                          <th>Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditoria.map(log => (
                          <tr key={log.id}>
                            <td>
                              {new Date(log.data_hora).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td>
                              <div>
                                <strong>{log.usuario_nome}</strong>
                                <div className="text-muted small">{log.usuario_email}</div>
                                <span className="badge bg-secondary">{log.usuario_tipo}</span>
                              </div>
                            </td>
                            <td>{getTipoAcaoBadge(log.tipo_acao)}</td>
                            <td>
                              <div className="fw-bold">{log.acao}</div>
                              <small className="text-muted">{log.descricao}</small>
                            </td>
                            <td>
                              <code>{log.ip_address}</code>
                              {log.user_agent && (
                                <div className="small text-muted mt-1" style={{ maxWidth: '200px' }}>
                                  {log.user_agent}
                                </div>
                              )}
                            </td>
                            <td>
                              {log.detalhes && (
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => alert(JSON.stringify(JSON.parse(log.detalhes), null, 2))}
                                >
                                  <i className="bi bi-code"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Conteúdo da Tab Estatísticas */}
              {activeTab === 'estatisticas' && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h5 className="mb-0">Pagamentos por Mês</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Mês</th>
                                <th>Total</th>
                                <th>Aprovados</th>
                                <th>Pendentes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stats).map(([mes, dados]) => (
                                <tr key={mes}>
                                  <td>{mes}</td>
                                  <td className="text-success fw-bold">{formatarValor(dados.total)}</td>
                                  <td className="text-primary">{formatarValor(dados.aprovados)}</td>
                                  <td className="text-warning">{formatarValor(dados.pendentes)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Distribuição por Status</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-success rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                              <div>
                                <div className="small">Aprovados</div>
                                <div className="fw-bold">{pagamentos.filter(p => p.status === 'pago').length}</div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-warning rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                              <div>
                                <div className="small">Pendentes</div>
                                <div className="fw-bold">{pagamentos.filter(p => p.status === 'pendente').length}</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-danger rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                              <div>
                                <div className="small">Rejeitados</div>
                                <div className="fw-bold">{pagamentos.filter(p => p.status === 'rejeitado').length}</div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-secondary rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                              <div>
                                <div className="small">Outros</div>
                                <div className="fw-bold">
                                  {pagamentos.filter(p => !['pago', 'pendente', 'rejeitado'].includes(p.status)).length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo do Dia */}
          <div className="row">
            <div className="col-md-4">
              <div className="card border-primary">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">Hoje</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="small text-muted">Novos Pagamentos</div>
                      <div className="h4">
                        {pagamentos.filter(p => {
                          const hoje = new Date().toDateString();
                          const dataPagamento = new Date(p.data_pagamento).toDateString();
                          return dataPagamento === hoje;
                        }).length}
                      </div>
                    </div>
                    <i className="bi bi-calendar-day text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <h6 className="mb-0">Esta Semana</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="small text-muted">Valor Recebido</div>
                      <div className="h4">
                        {formatarValor(
                          pagamentos
                            .filter(p => {
                              const umaSemanaAtras = new Date();
                              umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
                              return new Date(p.data_pagamento) >= umaSemanaAtras && p.status === 'pago';
                            })
                            .reduce((total, p) => total + parseFloat(p.valor), 0)
                        )}
                      </div>
                    </div>
                    <i className="bi bi-calendar-week text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-info">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">Este Mês</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="small text-muted">Total de Transações</div>
                      <div className="h4">
                        {pagamentos.filter(p => {
                          const hoje = new Date();
                          const dataPagamento = new Date(p.data_pagamento);
                          return dataPagamento.getMonth() === hoje.getMonth() && 
                                 dataPagamento.getFullYear() === hoje.getFullYear();
                        }).length}
                      </div>
                    </div>
                    <i className="bi bi-calendar-month text-info" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}