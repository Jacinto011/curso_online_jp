import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import api from '@/lib/api';

export default function MatriculasInstrutor() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('pendente_pagamento');
  const [modalComprovante, setModalComprovante] = useState(null);
  const [modalAcao, setModalAcao] = useState({ open: false, matricula: null });

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }
    fetchMatriculas();
  }, [isInstructor, filtroStatus]);

  const fetchMatriculas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/instructor/matriculas?status=${filtroStatus}`);
      setMatriculas(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    } finally {
      setLoading(false);
    }
  };

  const visualizarComprovante = (pagamento) => {
    setModalComprovante(pagamento);
  };

  const abrirModalAcao = (matricula, acao) => {
    setModalAcao({ 
      open: true, 
      matricula, 
      acao: acao 
    });
  };

  const handleAprovarMatricula = async (matriculaId, motivo = null) => {
    try {
      const response = await api.put('/api/instructor/matriculas/aprovar', {
        matricula_id: matriculaId,
        motivo: motivo
      });
      
      if (response.data.success) {
        alert('Matrícula aprovada com sucesso!');
        fetchMatriculas();
        
        // Criar notificação para o estudante
        await api.post('/api/notificacoes', {
          usuario_id: response.data.estudante_id,
          tipo: 'matricula',
          titulo: 'Matrícula Aprovada',
          mensagem: `Sua matrícula no curso "${response.data.curso_titulo}" foi aprovada. Você já pode acessar o curso.`,
          link: `/cursos/${response.data.curso_id}`
        });
      }
    } catch (error) {
      console.error('Erro ao aprovar matrícula:', error);
      alert('Erro ao aprovar matrícula');
    }
  };

  const handleRejeitarMatricula = async (matriculaId, motivo) => {
    try {
      const response = await api.put('/api/instructor/matriculas/rejeitar', {
        matricula_id: matriculaId,
        motivo: motivo
      });
      
      if (response.data.success) {
        alert('Matrícula rejeitada');
        fetchMatriculas();
        
        // Criar notificação para o estudante
        await api.post('/api/notificacoes', {
          usuario_id: response.data.estudante_id,
          tipo: 'matricula',
          titulo: 'Matrícula Rejeitada',
          mensagem: `Sua matrícula no curso "${response.data.curso_titulo}" foi rejeitada. Motivo: ${motivo}`,
          link: `/cursos/${response.data.curso_id}`
        });
      }
    } catch (error) {
      console.error('Erro ao rejeitar matrícula:', error);
      alert('Erro ao rejeitar matrícula');
    }
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendente_pagamento': 'bg-warning',
      'pendente_confirmacao': 'bg-info',
      'ativa': 'bg-success',
      'rejeitada': 'bg-danger',
      'suspensa': 'bg-secondary'
    };
    
    const textos = {
      'pendente_pagamento': 'Pagamento Pendente',
      'pendente_confirmacao': 'Aguardando Confirmação',
      'ativa': 'Ativa',
      'rejeitada': 'Rejeitada',
      'suspensa': 'Suspensa'
    };
    
    return (
      <span className={`badge ${badges[status] || 'bg-secondary'}`}>
        {textos[status] || status}
      </span>
    );
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
            <h1 className="mb-0">Matrículas</h1>
            <div className="dropdown">
              <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                Status: {filtroStatus === 'pendente_pagamento' ? 'Pendentes' : 'Todas'}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => setFiltroStatus('pendente_pagamento')}
                  >
                    Pendentes
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => setFiltroStatus('todos')}
                  >
                    Todas
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              {matriculas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">
                    {filtroStatus === 'pendente_pagamento' 
                      ? 'Nenhuma matrícula pendente' 
                      : 'Nenhuma matrícula encontrada'
                    }
                  </h4>
                  <p className="text-muted">
                    {filtroStatus === 'pendente_pagamento' 
                      ? 'Todas as matrículas foram processadas' 
                      : 'Não há matrículas para exibir'
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Estudante</th>
                        <th>Curso</th>
                        <th>Data</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Comprovante</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.map(matricula => (
                        <tr key={matricula.id}>
                          <td>
                            <div>
                              <strong>{matricula.estudante_nome}</strong>
                              <div className="text-muted small">{matricula.estudante_email}</div>
                              <div className="text-muted small">{matricula.estudante_telefone}</div>
                            </div>
                          </td>
                          <td>
                            <strong>{matricula.curso_titulo}</strong>
                            <div className="text-muted small">
                              {matricula.categoria} • {matricula.nivel}
                            </div>
                          </td>
                          <td>
                            {formatarData(matricula.data_matricula)}
                          </td>
                          <td>
                            <strong>
                              {matricula.valor > 0 
                                ? new Intl.NumberFormat('pt-MZ', { 
                                    style: 'currency', 
                                    currency: 'MZN' 
                                  }).format(matricula.valor)
                                : 'Gratuito'
                              }
                            </strong>
                          </td>
                          <td>
                            {getStatusBadge(matricula.status)}
                          </td>
                          <td>
                            {matricula.comprovante_url ? (
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => visualizarComprovante(matricula)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                Visualizar
                              </button>
                            ) : (
                              <span className="text-muted">Não enviado</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {matricula.status === 'pendente_pagamento' && matricula.comprovante_url && (
                                <>
                                  <button 
                                    className="btn btn-success"
                                    onClick={() => abrirModalAcao(matricula, 'aprovar')}
                                  >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Aprovar
                                  </button>
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => abrirModalAcao(matricula, 'rejeitar')}
                                  >
                                    <i className="bi bi-x-circle me-1"></i>
                                    Rejeitar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Visualização de Comprovante */}
      {modalComprovante && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Comprovante de Pagamento</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalComprovante(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6>Detalhes da Transação:</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Estudante:</strong> {modalComprovante.estudante_nome}</p>
                      <p className="mb-1"><strong>Curso:</strong> {modalComprovante.curso_titulo}</p>
                      <p className="mb-1"><strong>Valor:</strong> {new Intl.NumberFormat('pt-MZ', { 
                        style: 'currency', 
                        currency: 'MZN' 
                      }).format(modalComprovante.valor)}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Data:</strong> {formatarData(modalComprovante.data_pagamento)}</p>
                      <p className="mb-1"><strong>Método:</strong> {modalComprovante.metodo_pagamento}</p>
                      <p className="mb-1"><strong>Status:</strong> {getStatusBadge(modalComprovante.status)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  {modalComprovante.comprovante_url.endsWith('.pdf') ? (
                    <iframe 
                      src={modalComprovante.comprovante_url}
                      className="w-100"
                      style={{ height: '500px' }}
                      title="Comprovante PDF"
                    />
                  ) : (
                    <img 
                      src={modalComprovante.comprovante_url}
                      alt="Comprovante de pagamento"
                      className="img-fluid rounded"
                      style={{ maxHeight: '500px' }}
                    />
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <a 
                    href={modalComprovante.comprovante_url}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-download me-2"></i>
                    Baixar Comprovante
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ação (Aprovar/Rejeitar) */}
      {modalAcao.open && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAcao.acao === 'aprovar' ? 'Aprovar Matrícula' : 'Rejeitar Matrícula'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalAcao({ open: false, matricula: null })}
                ></button>
              </div>
              <div className="modal-body">
                {modalAcao.acao === 'aprovar' ? (
                  <div>
                    <p>
                      Você está prestes a aprovar a matrícula de <strong>{modalAcao.matricula.estudante_nome}</strong> 
                      no curso <strong>{modalAcao.matricula.curso_titulo}</strong>.
                    </p>
                    <p className="text-muted">
                      Após a aprovação, o estudante terá acesso imediato ao curso.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>
                      Você está prestes a rejeitar a matrícula de <strong>{modalAcao.matricula.estudante_nome}</strong> 
                      no curso <strong>{modalAcao.matricula.curso_titulo}</strong>.
                    </p>
                    <div className="mb-3">
                      <label htmlFor="motivoRejeicao" className="form-label">
                        Motivo da Rejeição (obrigatório)
                      </label>
                      <textarea 
                        id="motivoRejeicao"
                        className="form-control"
                        rows="3"
                        placeholder="Descreva o motivo da rejeição..."
                        onChange={(e) => setModalAcao(prev => ({
                          ...prev,
                          motivo: e.target.value
                        }))}
                      ></textarea>
                      <small className="text-muted">
                        Este motivo será enviado ao estudante.
                      </small>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setModalAcao({ open: false, matricula: null })}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={`btn ${modalAcao.acao === 'aprovar' ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => {
                    if (modalAcao.acao === 'aprovar') {
                      handleAprovarMatricula(modalAcao.matricula.id);
                    } else {
                      if (!modalAcao.motivo || modalAcao.motivo.trim().length < 10) {
                        alert('Por favor, forneça um motivo detalhado para a rejeição (mínimo 10 caracteres)');
                        return;
                      }
                      handleRejeitarMatricula(modalAcao.matricula.id, modalAcao.motivo);
                    }
                    setModalAcao({ open: false, matricula: null });
                  }}
                >
                  {modalAcao.acao === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}