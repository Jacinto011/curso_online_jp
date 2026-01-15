import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../lib/api';

export default function PagamentosInstrutor() {
  const { user, isInstructor } = useAuth();
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pendente');
  const [processando, setProcessando] = useState(null);
  const [resumo, setResumo] = useState({
    totalBruto: 0,
    totalLiquido: 0,
    comissaoPlataforma: 0,
    pendentes: 0,
    aprovados: 0,
    rejeitados: 0
  });

  useEffect(() => {
    if (!isInstructor || !user) {
      router.push('/auth/login');
      return;
    }
    fetchPagamentos();
  }, [isInstructor, user, status]);

  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/instructor/pagamentos', {
        params: {
          status: status,
          instrutor_id: user.id
        }
      });
      //console.log(response.data?.data);
      
      setPagamentos(response.data?.data || []);
      calcularResumo(response.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularResumo = (pagamentosList) => {
    const aprovados = pagamentosList.filter(p => p.status === 'pago');
    const pendentes = pagamentosList.filter(p => p.status === 'pendente');
    const rejeitados = pagamentosList.filter(p => p.status === 'rejeitado');

    const totalBruto = aprovados.reduce((total, p) => total + p.valor, 0);
    const comissaoPlataforma = totalBruto * 0.1; // 10% de comissão
    const totalLiquido = totalBruto - comissaoPlataforma;

    setResumo({
      totalBruto,
      totalLiquido,
      comissaoPlataforma,
      pendentes: pendentes.length,
      aprovados: aprovados.length,
      rejeitados: rejeitados.length
    });
  };

  const handleProcessarPagamento = async (pagamentoId, acao) => {
    if (!window.confirm(`Deseja ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'} este pagamento?`)) {
      return;
    }

    setProcessando(pagamentoId);
    
    try {
      const observacoes = prompt('Adicione observações (opcional):');
      
      const response = await api.put('/instructor/pagamentos/processar', {
        pagamento_id: pagamentoId,
        acao,
        observacoes: observacoes || '',
        instrutor_id: user.id
      });

      if (response.data.success) {
        alert(`Pagamento ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        fetchPagamentos(); // Recarregar lista
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao processar pagamento');
    } finally {
      setProcessando(null);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor);
  };

  const calcularComissao = (valor) => {
    const valorCurso = valor / 1.1; // Remove taxa de 10%
    const comissao = valor - valorCurso;
    return {
      valorCurso: formatarValor(valorCurso),
      comissao: formatarValor(comissao),
      liquido: formatarValor(valorCurso)
    };
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-MZ') + ' ' + data.toLocaleTimeString('pt-MZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
          <h1 className="mb-4">Gerenciar Pagamentos</h1>

          {/* Estatísticas */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Total Líquido</h5>
                  <h2>{formatarValor(resumo.totalLiquido)}</h2>
                  <small className="opacity-75">
                    Bruto: {formatarValor(resumo.totalBruto)}
                  </small>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <h5 className="card-title">Pendentes</h5>
                  <h2>{resumo.pendentes}</h2>
                  <small className="text-muted">Aguardando confirmação</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Aprovados</h5>
                  <h2>{resumo.aprovados}</h2>
                  <small className="opacity-75">Pagamentos confirmados</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-danger text-white">
                <div className="card-body">
                  <h5 className="card-title">Rejeitados</h5>
                  <h2>{resumo.rejeitados}</h2>
                  <small className="opacity-75">Pagamentos recusados</small>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <label htmlFor="status" className="form-label">Filtrar por Status</label>
                  <select
                    className="form-select"
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Aprovados</option>
                    <option value="rejeitado">Rejeitados</option>
                    <option value="todos">Todos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Pagamentos */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pagamentos</h5>
              <span className="badge bg-primary">
                {pagamentos.length} {pagamentos.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <div className="card-body">
              {pagamentos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cash-coin text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum pagamento encontrado</h4>
                  <p className="text-muted">
                    Não há pagamentos com o status "{status}"
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Estudante</th>
                        <th>Curso</th>
                        <th>Valor</th>
                        <th>Método</th>
                        <th>Data Pagamento</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map(pagamento => {
                        const { comissao, liquido } = calcularComissao(pagamento.valor);
                        
                        return (
                          <tr key={pagamento.id}>
                            <td>
                              <code>{pagamento.codigo_transacao}</code>
                            </td>
                            <td>
                              <div>
                                <strong>{pagamento.estudante_nome}</strong>
                                <div className="text-muted small">{pagamento.estudante_email}</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{pagamento.curso_titulo}</strong>
                                <div className="text-muted small">
                                  Matrícula: {pagamento.matricula_status}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{formatarValor(pagamento.valor)}</strong>
                                <div className="text-muted small">
                                  Líquido: {liquido}
                                </div>
                                <div className="text-muted small">
                                  Comissão: {comissao}
                                </div>
                              </div>
                            </td>
                            <td>
                              {pagamento.metodo_pagamento_nome || 'Transferência'}
                            </td>
                            <td>
                              {formatarData(pagamento.data_pagamento)}
                              {pagamento.data_confirmacao && (
                                <div className="text-muted small">
                                  Confirmado: {formatarData(pagamento.data_confirmacao)}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`badge bg-${
                                pagamento.status === 'pago' ? 'success' :
                                pagamento.status === 'rejeitado' ? 'danger' : 'warning'
                              }`}>
                                {pagamento.status === 'pago' ? 'Aprovado' :
                                 pagamento.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                              </span>
                              {pagamento.observacoes && (
                                <div className="text-muted small mt-1" title={pagamento.observacoes}>
                                  <i className="bi bi-info-circle"></i> {pagamento.observacoes.substring(0, 30)}...
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group">
                                {pagamento.comprovante_url && (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                                    title="Ver comprovante"
                                  >
                                    <i className="bi bi-file-earmark-text"></i>
                                  </button>
                                )}
                                
                                {pagamento.status === 'pendente' ? (
                                  <>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleProcessarPagamento(pagamento.id, 'aprovar')}
                                      disabled={processando === pagamento.id}
                                      title="Aprovar pagamento"
                                    >
                                      {processando === pagamento.id ? (
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                      ) : (
                                        <i className="bi bi-check-lg"></i>
                                      )}
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() => handleProcessarPagamento(pagamento.id, 'rejeitar')}
                                      disabled={processando === pagamento.id}
                                      title="Rejeitar pagamento"
                                    >
                                      <i className="bi bi-x-lg"></i>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-muted small">
                                    Processado
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Resumo Financeiro Detalhado</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card border-success">
                    <div className="card-body">
                      <h6 className="card-title">Total Bruto Recebido</h6>
                      <h3 className="text-success">
                        {formatarValor(resumo.totalBruto)}
                      </h3>
                      <small className="text-muted">
                        Soma de todos os pagamentos aprovados
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-3">
                  <div className="card border-warning">
                    <div className="card-body">
                      <h6 className="card-title">Comissão da Plataforma (10%)</h6>
                      <h3 className="text-warning">
                        {formatarValor(resumo.comissaoPlataforma)}
                      </h3>
                      <small className="text-muted">
                        Valor retido pela plataforma
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h6 className="card-title">Total Líquido a Receber</h6>
                      <h3 className="text-primary">
                        {formatarValor(resumo.totalLiquido)}
                      </h3>
                      <small className="text-muted">
                        Valor que você recebe
                      </small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Informação importante:</strong> A comissão de 10% é retida pela plataforma para manutenção 
                e melhorias. O valor líquido é transferido para sua conta bancária conforme combinado.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}