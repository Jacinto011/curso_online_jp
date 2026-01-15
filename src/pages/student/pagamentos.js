import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../lib/api';

export default function MeusPagamentos() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchMeusPagamentos();
  }, [isAuthenticated]);

  const fetchMeusPagamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/meus-pagamentos');
      setPagamentos(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Meus Pagamentos</h1>
          
          {pagamentos.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-cash-coin text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3 mb-2">Nenhum pagamento encontrado</h4>
                <p className="text-muted">
                  Você ainda não realizou nenhum pagamento
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push('/cursos')}
                >
                  <i className="bi bi-search me-2"></i>
                  Explorar Cursos
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h6 className="card-title">Total Investido</h6>
                      <h4 className="text-primary">
                        {formatarValor(
                          pagamentos
                            .filter(p => p.status === 'pago')
                            .reduce((total, p) => total + parseFloat(p.valor), 0)
                        )}
                      </h4>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-success">
                    <div className="card-body">
                      <h6 className="card-title">Aprovados</h6>
                      <h4 className="text-success">
                        {pagamentos.filter(p => p.status === 'pago').length}
                      </h4>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-warning">
                    <div className="card-body">
                      <h6 className="card-title">Pendentes</h6>
                      <h4 className="text-warning">
                        {pagamentos.filter(p => p.status === 'pendente').length}
                      </h4>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-danger">
                    <div className="card-body">
                      <h6 className="card-title">Rejeitados</h6>
                      <h4 className="text-danger">
                        {pagamentos.filter(p => p.status === 'rejeitado').length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Pagamentos */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Histórico de Pagamentos</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Código</th>
                          <th>Valor</th>
                          <th>Método</th>
                          <th>Data</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentos.map(pagamento => (
                          <tr key={pagamento.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {pagamento.curso_imagem && (
                                  <img 
                                    src={pagamento.curso_imagem} 
                                    alt={pagamento.curso_titulo}
                                    className="rounded me-3"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  />
                                )}
                                <div>
                                  <strong>{pagamento.curso_titulo}</strong>
                                  <div className="text-muted small">
                                    Instrutor: {pagamento.instrutor_nome}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <code className="small">{pagamento.codigo_transacao}</code>
                            </td>
                            <td>
                              <strong>{formatarValor(pagamento.valor)}</strong>
                            </td>
                            <td>{pagamento.metodo_pagamento_nome || 'Transferência'}</td>
                            <td>
                              {new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}
                            </td>
                            <td>{getStatusBadge(pagamento.status)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                                title="Ver comprovante"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              {pagamento.status === 'pendente' && (
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => alert('Entre em contato com o instrutor para atualizações')}
                                  title="Verificar status"
                                >
                                  <i className="bi bi-question-circle"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Informações Importantes */}
              <div className="alert alert-info mt-4">
                <h5><i className="bi bi-info-circle me-2"></i>Informações Importantes</h5>
                <ul className="mb-0">
                  <li>Pagamentos pendentes são normalmente confirmados em até 48 horas</li>
                  <li>Em caso de problemas, entre em contato diretamente com o instrutor do curso</li>
                  <li>Conserve os comprovantes de pagamento para eventuais comprovações</li>
                  <li>A plataforma não armazena dados de cartão de crédito</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}