import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../../lib/api';

export default function DetalhesPagamento() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [pagamento, setPagamento] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [novoStatus, setNovoStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin' || !id) {
      router.push('/auth/login');
      return;
    }
    carregarDetalhes();
  }, [isAuthenticated, user, id]);

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/pagamentos/${id}/detalhes`);
      setPagamento(response.data.data.pagamento);
      setHistorico(response.data.data.historico || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async () => {
    if (!novoStatus) {
      alert('Selecione um status');
      return;
    }

    try {
      await api.put(`/admin/pagamentos/${id}/status`, {
        status: novoStatus,
        observacoes
      });
      alert('Status atualizado com sucesso!');
      carregarDetalhes();
      setObservacoes('');
      setNovoStatus('');
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

  const formatarDataParaExibicao = (dataString) => {
    if (!dataString) return 'N/A';
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return 'Data inválida';
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Erro na formatação';
    }
  };

  const calcularTempoProcessamento = () => {
    if (!pagamento?.tempo_processamento) {
      if (!pagamento?.created_at && !pagamento?.data_pagamento) return 'N/A';
      
      const dataCriacao = new Date(pagamento.created_at || pagamento.data_pagamento);
      const agora = new Date();
      const diffMs = agora - dataCriacao;
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDias = Math.floor(diffHoras / 24);
      
      if (diffDias > 0) {
        return `${diffDias} dia${diffDias > 1 ? 's' : ''}`;
      } else if (diffHoras > 0) {
        return `${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
      } else {
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
      }
    }
    
    return pagamento.tempo_processamento;
  };

  const verComprovante = () => {
    if (!pagamento?.comprovante_url) {
      alert('Nenhum comprovante disponível');
      return;
    }
    window.open(pagamento.comprovante_url, '_blank');
  };

  const baixarComprovante = () => {
    if (!pagamento?.comprovante_url) {
      alert('Nenhum comprovante disponível');
      return;
    }
    
    const link = document.createElement('a');
    link.href = pagamento.comprovante_url;
    link.download = `comprovante-${pagamento.codigo_transacao || id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!pagamento) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Pagamento não encontrado</h4>
          <button className="btn btn-primary" onClick={() => router.push('/admin/pagamentos')}>
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 mb-0">Detalhes do Pagamento</h1>
              <p className="text-muted mb-0">ID: {id} | Código: {pagamento.codigo_transacao || 'N/A'}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => router.push('/admin/pagamentos')}>
              <i className="bi bi-arrow-left me-2"></i>
              Voltar
            </button>
          </div>

          <div className="row">
            {/* Coluna Principal */}
            <div className="col-lg-8">
              {/* Card de Informações do Pagamento */}
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-credit-card me-2"></i>
                    Informações do Pagamento
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label text-muted">Código da Transação</label>
                        <div className="h5">
                          <code>{pagamento.codigo_transacao || 'N/A'}</code>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label text-muted">Status Atual</label>
                        <div className="d-flex align-items-center">
                          {getStatusBadge(pagamento.status)}
                          <div className="ms-3">
                            <small className="text-muted d-block">Tempo em processamento:</small>
                            <strong>{calcularTempoProcessamento()}</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label text-muted">Método de Pagamento</label>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-cash-coin fs-4 text-primary me-3"></i>
                          <div>
                            <div className="h5">{pagamento.metodo_pagamento_nome || 'Transferência Bancária'}</div>
                            {pagamento.metodo_pagamento_descricao && (
                              <small className="text-muted">{pagamento.metodo_pagamento_descricao}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label text-muted">Valor</label>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-currency-dollar fs-1 text-success me-3"></i>
                          <div className="h2 text-success">{formatarValor(pagamento.valor)}</div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label text-muted">Datas</label>
                        <div className="list-group list-group-flush">
                          <div className="list-group-item d-flex justify-content-between px-0">
                            <span>Data do pagamento:</span>
                            <span>{formatarDataParaExibicao(pagamento.data_pagamento)}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between px-0">
                            <span>Registrado em:</span>
                            <span>{formatarDataParaExibicao(pagamento.created_at)}</span>
                          </div>
                          {pagamento.updated_at && (
                            <div className="list-group-item d-flex justify-content-between px-0">
                              <span>Última atualização:</span>
                              <span>{formatarDataParaExibicao(pagamento.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comprovante */}
                  <div className="border-top pt-4 mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>
                        <i className="bi bi-receipt me-2"></i>
                        Comprovante de Pagamento
                      </h5>
                      <div className="btn-group">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={verComprovante}
                          disabled={!pagamento.comprovante_url}
                        >
                          <i className="bi bi-eye me-2"></i>
                          Visualizar
                        </button>
                        <button 
                          className="btn btn-outline-success"
                          onClick={baixarComprovante}
                          disabled={!pagamento.comprovante_url}
                        >
                          <i className="bi bi-download me-2"></i>
                          Baixar
                        </button>
                      </div>
                    </div>
                    
                    {pagamento.comprovante_url ? (
                      <div className="alert alert-info">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-check-circle fs-4 me-3 text-success"></i>
                          <div>
                            <strong>Comprovante disponível</strong>
                            <div className="small mt-1">
                              URL: <code className="small">{pagamento.comprovante_url}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Nenhum comprovante anexado a este pagamento.
                      </div>
                    )}
                  </div>
                  
                  {/* Observações */}
                  {pagamento.observacoes && (
                    <div className="border-top pt-4 mt-4">
                      <h5><i className="bi bi-chat-text me-2"></i>Observações</h5>
                      <div className="alert alert-light border">
                        {pagamento.observacoes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Alterações */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-clock-history me-2"></i>
                    Histórico de Alterações
                  </h5>
                </div>
                <div className="card-body">
                  {historico.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-clock text-muted fs-1 mb-3"></i>
                      <p className="text-muted">Nenhuma alteração registrada</p>
                    </div>
                  ) : (
                    <div className="timeline">
                      {historico.map((item, index) => (
                        <div key={index} className="timeline-item mb-3">
                          <div className="d-flex">
                            <div className="timeline-marker">
                              <i className="bi bi-circle-fill text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div>
                                  {getStatusBadge(item.status)}
                                  <span className="ms-2 small text-muted">
                                    por <strong>{item.usuario_nome || 'Sistema'}</strong>
                                  </span>
                                </div>
                                <small className="text-muted">
                                  {item.data_registro_formatada || formatarDataParaExibicao(item.data_registro)}
                                </small>
                              </div>
                              <div className="border-start border-2 ps-3 ms-1">
                                <p className="mb-1">{item.observacoes || 'Sem observações'}</p>
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

            {/* Coluna Lateral */}
            <div className="col-lg-4">
              {/* Card do Estudante */}
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-person me-2"></i>
                    Dados do Estudante
                  </h5>
                </div>
                <div className="card-body">
                  <div className="text-center mb-3">
                    <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-person text-white" style={{ fontSize: '2rem' }}></i>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label text-muted">Nome</label>
                    <div className="h5">{pagamento.estudante_nome || 'Não informado'}</div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted">Email</label>
                      <div className="small">{pagamento.estudante_email || 'Não informado'}</div>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted">Telefone</label>
                      <div className="small">{pagamento.estudante_telefone || 'Não informado'}</div>
                    </div>
                  </div>
                  
                  {pagamento.estudante_id && (
                    <button 
                      className="btn btn-outline-info w-100"
                      onClick={() => router.push(`/admin/usuarios/${pagamento.estudante_id}`)}
                    >
                      <i className="bi bi-person-circle me-2"></i>
                      Ver Perfil Completo
                    </button>
                  )}
                </div>
              </div>

              {/* Card do Curso */}
              <div className="card mb-4">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-book me-2"></i>
                    Dados do Curso
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">Curso</label>
                    <div className="h5">{pagamento.curso_titulo || 'Curso não encontrado'}</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label text-muted">Instrutor</label>
                    <div className="h6">{pagamento.instrutor_nome || 'Não informado'}</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label text-muted">Preço do Curso</label>
                    <div className="h6 text-success">
                      {pagamento.curso_preco ? formatarValor(pagamento.curso_preco) : 'Não informado'}
                    </div>
                  </div>
                  
                  {pagamento.curso_id && (
                    <button 
                      className="btn btn-outline-success w-100"
                      onClick={() => router.push(`/admin/cursos/${pagamento.curso_id}`)}
                    >
                      <i className="bi bi-eye me-2"></i>
                      Ver Detalhes do Curso
                    </button>
                  )}
                </div>
              </div>

              {/* Ações Administrativas */}
              <div className="card">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    Ações Administrativas
                  </h5>
                </div>
                <div className="card-body">
                  {pagamento.status === 'pago' ? (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      <strong>Pagamento já foi aprovado</strong>
                    </div>
                  ) : pagamento.status === 'rejeitado' ? (
                    <div className="alert alert-danger">
                      <i className="bi bi-x-circle me-2"></i>
                      <strong>Pagamento rejeitado</strong>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Alterar Status</label>
                        <select 
                          className="form-select"
                          value={novoStatus}
                          onChange={(e) => setNovoStatus(e.target.value)}
                        >
                          <option value="">Selecione uma ação...</option>
                          <option value="pago">✅ Aprovar Pagamento</option>
                          <option value="rejeitado">❌ Rejeitar Pagamento</option>
                          <option value="processando">⏳ Processando</option>
                          <option value="cancelado">🚫 Cancelar</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Motivo</label>
                        <textarea 
                          className="form-control"
                          rows="3"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Descreva o motivo da alteração..."
                        ></textarea>
                      </div>
                      
                      <button 
                        className="btn btn-warning w-100"
                        onClick={atualizarStatus}
                        disabled={!novoStatus}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Confirmar Alteração
                      </button>
                    </>
                  )}
                  
                  <div className="mt-4">
                    <h6 className="border-bottom pb-2 mb-3">Outras Ações</h6>
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => window.print()}
                      >
                        <i className="bi bi-printer me-2"></i>
                        Imprimir
                      </button>
                    </div>
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