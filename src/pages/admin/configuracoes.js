import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function ConfigurarSistema() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [configuracoes, setConfiguracoes] = useState({
    nome_plataforma: 'Plataforma de Cursos Online',
    email_suporte: 'suporte@curso.com',
    url_plataforma: 'http://localhost:3000',
    manutencao: false,
    novos_cursos_aprovacao: false,
    limite_matriculas: 100,
    tempo_sessao: 24
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/auth/login');
      return;
    }
    fetchConfiguracoes();
  }, [isAdmin]);

  const fetchConfiguracoes = async () => {
    try {
      const response = await api.get('/admin/configuracoes');
      setConfiguracoes(response.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setErro('Erro ao carregar configurações');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfiguracoes(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      await api.put('/admin/configuracoes', configuracoes);
      setSucesso('Configurações salvas com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao salvar configurações');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setSalvando(false);
    }
  };

  const handleResetCache = async () => {
    if (!window.confirm('Tem certeza que deseja limpar o cache do sistema? Isso pode afetar temporariamente o desempenho.')) {
      return;
    }

    try {
      await api.post('/admin/configuracoes/reset-cache');
      setSucesso('Cache limpo com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao limpar cache');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await api.post('/admin/configuracoes/backup');
      
      // Criar link para download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSucesso('Backup realizado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao realizar backup');
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
              <h1 className="mb-1">Configurações do Sistema</h1>
              <p className="text-muted mb-0">
                Configure as opções gerais da plataforma
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

          <div className="row">
            {/* Formulário de Configurações */}
            <div className="col-md-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Configurações Gerais</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="nome_plataforma" className="form-label">
                          Nome da Plataforma *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nome_plataforma"
                          name="nome_plataforma"
                          value={configuracoes.nome_plataforma}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email_suporte" className="form-label">
                          Email de Suporte *
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email_suporte"
                          name="email_suporte"
                          value={configuracoes.email_suporte}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="url_plataforma" className="form-label">
                          URL da Plataforma *
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="url_plataforma"
                          name="url_plataforma"
                          value={configuracoes.url_plataforma}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label htmlFor="limite_matriculas" className="form-label">
                          Limite de Matrículas por Curso
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="limite_matriculas"
                          name="limite_matriculas"
                          value={configuracoes.limite_matriculas}
                          onChange={handleChange}
                          min="1"
                          max="1000"
                        />
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label htmlFor="tempo_sessao" className="form-label">
                          Tempo de Sessão (horas)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="tempo_sessao"
                          name="tempo_sessao"
                          value={configuracoes.tempo_sessao}
                          onChange={handleChange}
                          min="1"
                          max="168"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="manutencao"
                          name="manutencao"
                          checked={configuracoes.manutencao}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="manutencao">
                          <strong>Modo de Manutenção</strong>
                          <p className="text-muted small mb-0">
                            Quando ativado, apenas administradores podem acessar a plataforma
                          </p>
                        </label>
                      </div>
                      
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="novos_cursos_aprovacao"
                          name="novos_cursos_aprovacao"
                          checked={configuracoes.novos_cursos_aprovacao}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="novos_cursos_aprovacao">
                          <strong>Exigir Aprovação para Novos Cursos</strong>
                          <p className="text-muted small mb-0">
                            Novos cursos precisam de aprovação administrativa antes de serem publicados
                          </p>
                        </label>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => fetchConfiguracoes()}
                      >
                        Cancelar Alterações
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={salvando}
                      >
                        {salvando ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-save me-2"></i>
                            Salvar Configurações
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            {/* Ações do Sistema */}
            <div className="col-md-4">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Ações do Sistema</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleBackup}
                    >
                      <i className="bi bi-download me-2"></i>
                      Fazer Backup do Sistema
                    </button>
                    
                    <button
                      type="button"
                      className="btn btn-outline-warning"
                      onClick={handleResetCache}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Limpar Cache do Sistema
                    </button>
                    
                    <Link
                      href="/admin/logs"
                      className="btn btn-outline-info"
                    >
                      <i className="bi bi-journal-text me-2"></i>
                      Ver Logs do Sistema
                    </Link>
                    
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      data-bs-toggle="modal"
                      data-bs-target="#modalReset"
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Opções Avançadas
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Informações do Sistema */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Informações do Sistema</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Versão do Sistema</span>
                      <strong>1.0.0</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Banco de Dados</span>
                      <strong>SQLite</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Status do Banco</span>
                      <span className="badge bg-success">Conectado</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Último Backup</span>
                      <strong>Hoje</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Tamanho do Banco</span>
                      <strong>~2.5 MB</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal de Reset (placeholder) */}
          <div className="modal fade" id="modalReset" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Opções Avançadas</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Estas ações são irreversíveis. Use com cuidado!
                  </div>
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-danger" disabled>
                      <i className="bi bi-database-slash me-2"></i>
                      Resetar Banco de Dados (Em desenvolvimento)
                    </button>
                    <button className="btn btn-outline-danger" disabled>
                      <i className="bi bi-trash3 me-2"></i>
                      Remover Todos os Usuários (Em desenvolvimento)
                    </button>
                    <button className="btn btn-outline-danger" disabled>
                      <i className="bi bi-book-slash me-2"></i>
                      Remover Todos os Cursos (Em desenvolvimento)
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}