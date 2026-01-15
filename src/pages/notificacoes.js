import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../lib/api';

export default function Notificacoes() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);

  const itensPorPagina = 20;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchNotificacoes();
  }, [isAuthenticated, paginaAtual, apenasNaoLidas]);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const offset = (paginaAtual - 1) * itensPorPagina;
      const response = await api.get(
        `/notificacoes?limite=${itensPorPagina}&offset=${offset}&apenas_nao_lidas=${apenasNaoLidas}`
      );
      //console.log(response.data.data?.notificacoes);
      
      setNotificacoes(response.data.data?.notificacoes || []);
      // Calcular total de páginas
      const totalItens = response.data.total;
      setTotalPaginas(Math.ceil(totalItens / itensPorPagina));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await api.put('/notificacoes', {
        notificacao_id: id,
        acao: 'ler'
      });
      // Atualizar lista localmente
      setNotificacoes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, lida: 1, data_leitura: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const excluirNotificacao = async (id) => {
    if (!window.confirm('Deseja excluir esta notificação?')) return;
    
    try {
      await api.put('/api/notificacoes', {
        notificacao_id: id,
        acao: 'excluir'
      });
      setNotificacoes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await api.put('/api/notificacoes', { marcar_todas: true });
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: 1 })));
      alert('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const limparTodas = async () => {
    if (!window.confirm('Deseja limpar todas as notificações?')) return;
    
    try {
      // Implementar API para limpar todas (ou excluir uma por uma)
      for (const notificacao of notificacoes) {
        await api.put('/api/notificacoes', {
          notificacao_id: notificacao.id,
          acao: 'excluir'
        });
      }
      setNotificacoes([]);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (data.toDateString() === ontem.toDateString()) {
      return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return data.toLocaleDateString('pt-BR');
    }
  };

  const getIconePorTipo = (tipo) => {
    const icones = {
      'pagamento': 'bi-cash-coin',
      'matricula': 'bi-person-plus',
      'curso': 'bi-book',
      'sistema': 'bi-gear',
      'mensagem': 'bi-chat'
    };
    return icones[tipo] || 'bi-bell';
  };

  if (loading && paginaAtual === 1) {
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
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">
              <i className="bi bi-bell me-2"></i>
              Notificações
            </h1>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                onClick={marcarTodasComoLidas}
                disabled={notificacoes.length === 0 || notificacoes.every(n => n.lida)}
              >
                <i className="bi bi-check-all me-2"></i>
                Marcar todas como lidas
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={limparTodas}
                disabled={notificacoes.length === 0}
              >
                <i className="bi bi-trash me-2"></i>
                Limpar todas
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="apenasNaoLidas"
                      checked={apenasNaoLidas}
                      onChange={(e) => {
                        setApenasNaoLidas(e.target.checked);
                        setPaginaAtual(1);
                      }}
                    />
                    <label className="form-check-label" htmlFor="apenasNaoLidas">
                      Apenas não lidas
                    </label>
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <span className="text-muted">
                    {notificacoes.filter(n => !n.lida).length} não lidas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Notificações */}
          {notificacoes.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-bell text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3 mb-2">
                  {apenasNaoLidas ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </h4>
                <p className="text-muted">
                  {apenasNaoLidas 
                    ? 'Todas as notificações foram lidas' 
                    : 'Você não tem notificações no momento'}
                </p>
                {apenasNaoLidas && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setApenasNaoLidas(false)}
                  >
                    Ver todas as notificações
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="list-group">
                {notificacoes.map(notificacao => (
                  <div
                    key={notificacao.id}
                    className={`list-group-item list-group-item-action ${!notificacao.lida ? 'bg-light' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1 me-3">
                        <div className="d-flex align-items-center mb-1">
                          <i className={`bi ${getIconePorTipo(notificacao.tipo)} me-2 ${!notificacao.lida ? 'text-primary' : 'text-muted'}`}></i>
                          <h5 className="mb-0">
                            {!notificacao.lida && (
                              <span className="badge bg-primary me-2">Nova</span>
                            )}
                            {notificacao.titulo}
                          </h5>
                        </div>
                        <p className="mb-2">{notificacao.mensagem}</p>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {formatarData(notificacao.data_criacao)}
                          {notificacao.link && (
                            <>
                              <span className="mx-2">•</span>
                              <a 
                                href={notificacao.link} 
                                className="text-decoration-none"
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push(notificacao.link);
                                }}
                              >
                                <i className="bi bi-arrow-right me-1"></i>
                                Ver detalhes
                              </a>
                            </>
                          )}
                        </small>
                      </div>
                      <div className="btn-group btn-group-sm">
                        {!notificacao.lida && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => marcarComoLida(notificacao.id)}
                            title="Marcar como lida"
                          >
                            <i className="bi bi-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => excluirNotificacao(notificacao.id)}
                          title="Excluir"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${paginaAtual === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPaginaAtual(paginaAtual - 1)}
                        disabled={paginaAtual === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    
                    {[...Array(totalPaginas)].map((_, i) => (
                      <li key={i} className={`page-item ${paginaAtual === i + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPaginaAtual(i + 1)}
                        >
                          {i + 1}
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
              )}
            </>
          )}

          {/* Dicas */}
          <div className="alert alert-info mt-4">
            <h5><i className="bi bi-lightbulb me-2"></i>Dicas</h5>
            <ul className="mb-0">
              <li>Notificações são automaticamente criadas para pagamentos, matrículas e atualizações de cursos</li>
              <li>Você pode clicar em "Ver detalhes" para acessar diretamente o conteúdo relacionado</li>
              <li>Notificações não lidas aparecem destacadas em azul claro</li>
              <li>As notificações mais antigas são excluídas automaticamente após 90 dias</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}