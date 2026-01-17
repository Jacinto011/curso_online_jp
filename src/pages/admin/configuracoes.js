import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function ConfigurarSistema() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [configuracoes, setConfiguracoes] = useState({
    // Configurações gerais
    nome_plataforma: 'Plataforma de Cursos Online',
    email_suporte: 'suporte@curso.com',
    url_plataforma: 'http://localhost:3000',
    logo_url: '',
    favicon_url: '',
    
    // Configurações do sistema
    manutencao: false,
    novos_cursos_aprovacao: false,
    limite_matriculas: 100,
    tempo_sessao: 24,
    
    // Configurações financeiras
    moeda_padrao: 'MZN',
    moeda_simbolo: 'MT',
    moeda_formato: '1 234,56 MT',
    taxa_inscricao: 0,
    comissao_instrutor: 70,
    imposto_vat: 16,
    
    // Configurações de email
    email_host: 'smtp.gmail.com',
    email_port: 587,
    email_secure: false,
    email_user: '',
    email_pass: '',
    
    // Configurações de tema
    cor_primaria: '#007bff',
    cor_secundaria: '#6c757d',
    cor_sucesso: '#28a745',
    cor_perigo: '#dc3545',
    cor_aviso: '#ffc107',
    cor_info: '#17a2b8',
    
    // Outras configurações
    analytics_id: '',
    termos_uso: 'Termos de uso da plataforma...',
    politica_privacidade: 'Política de privacidade...'
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
      setLoading(true);
      const response = await api.get('/admin/configuracoes');
      if (response.data.success) {
        setConfiguracoes(response.data.data);
      } else {
        setErro('Erro ao carregar configurações');
        setTimeout(() => setErro(''), 3000);
      }
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
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const response = await api.put('/admin/configuracoes', configuracoes);
      if (response.data.success) {
        setSucesso('Configurações salvas com sucesso!');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        setErro(response.data.message || 'Erro ao salvar configurações');
        setTimeout(() => setErro(''), 3000);
      }
    } catch (error) {
      setErro(error.response?.data?.message || 'Erro ao salvar configurações');
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
      const response = await api.post('/admin/configuracoes', { action: 'reset-cache' });
      if (response.data.success) {
        setSucesso('Cache limpo com sucesso!');
        setTimeout(() => setSucesso(''), 3000);
      }
    } catch (error) {
      setErro('Erro ao limpar cache');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await api.post('/admin/configuracoes', { action: 'backup' });
      
      if (response.data.success) {
        // Criar link para download
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
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
      }
    } catch (error) {
      setErro('Erro ao realizar backup');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleRestaurarPadroes = async () => {
    if (!window.confirm('Tem certeza que deseja restaurar as configurações padrão? Todas as configurações personalizadas serão perdidas.')) {
      return;
    }

    try {
      const response = await api.post('/admin/configuracoes', { action: 'reset-defaults' });
      if (response.data.success) {
        setSucesso('Configurações padrão restauradas!');
        setTimeout(() => setSucesso(''), 3000);
        fetchConfiguracoes(); // Recarregar as configurações
      }
    } catch (error) {
      setErro('Erro ao restaurar configurações padrão');
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

          {/* Tabs de Configurações */}
          <ul className="nav nav-tabs mb-4" id="configTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button className="nav-link active" id="geral-tab" data-bs-toggle="tab" data-bs-target="#geral" type="button">
                <i className="bi bi-gear me-2"></i> Geral
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="financeiro-tab" data-bs-toggle="tab" data-bs-target="#financeiro" type="button">
                <i className="bi bi-currency-exchange me-2"></i> Financeiro
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="email-tab" data-bs-toggle="tab" data-bs-target="#email" type="button">
                <i className="bi bi-envelope me-2"></i> Email
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="tema-tab" data-bs-toggle="tab" data-bs-target="#tema" type="button">
                <i className="bi bi-palette me-2"></i> Tema
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="legal-tab" data-bs-toggle="tab" data-bs-target="#legal" type="button">
                <i className="bi bi-shield-check me-2"></i> Legal
              </button>
            </li>
          </ul>

          <div className="tab-content" id="configTabsContent">
            {/* Tab Geral */}
            <div className="tab-pane fade show active" id="geral" role="tabpanel">
              <div className="row">
                <div className="col-md-8">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Configurações Gerais</h5>
                    </div>
                    <div className="card-body">
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
                        
                        <div className="col-md-6 mb-3">
                          <label htmlFor="logo_url" className="form-label">
                            URL do Logo
                          </label>
                          <input
                            type="url"
                            className="form-control"
                            id="logo_url"
                            name="logo_url"
                            value={configuracoes.logo_url}
                            onChange={handleChange}
                            placeholder="https://exemplo.com/logo.png"
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
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
                        
                        <div className="col-md-4 mb-3">
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

                        <div className="col-md-4 mb-3">
                          <label htmlFor="analytics_id" className="form-label">
                            Google Analytics ID
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="analytics_id"
                            name="analytics_id"
                            value={configuracoes.analytics_id}
                            onChange={handleChange}
                            placeholder="UA-XXXXX-Y"
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
                        
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleRestaurarPadroes}
                        >
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Restaurar Padrões
                        </button>
                        
                        <Link
                          href="/admin/logs"
                          className="btn btn-outline-info"
                        >
                          <i className="bi bi-journal-text me-2"></i>
                          Ver Logs do Sistema
                        </Link>
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
                          <span>Moeda Padrão</span>
                          <strong>{configuracoes.moeda_padrao}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Símbolo</span>
                          <strong>{configuracoes.moeda_simbolo}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Formato</span>
                          <strong>{configuracoes.moeda_formato}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Comissão Instrutor</span>
                          <strong>{configuracoes.comissao_instrutor}%</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>IVA/VAT</span>
                          <strong>{configuracoes.imposto_vat}%</strong>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Financeiro */}
            <div className="tab-pane fade" id="financeiro" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Configurações Financeiras</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="moeda_padrao" className="form-label">
                        Moeda Padrão
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="moeda_padrao"
                        name="moeda_padrao"
                        value={configuracoes.moeda_padrao}
                        onChange={handleChange}
                        readOnly
                      />
                      <small className="text-muted">Moeda fixa: MZN (Moçambique)</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="moeda_simbolo" className="form-label">
                        Símbolo da Moeda
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="moeda_simbolo"
                        name="moeda_simbolo"
                        value={configuracoes.moeda_simbolo}
                        onChange={handleChange}
                      />
                      <small className="text-muted">Exemplo: MT</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="moeda_formato" className="form-label">
                        Formato de Exibição
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="moeda_formato"
                        name="moeda_formato"
                        value={configuracoes.moeda_formato}
                        onChange={handleChange}
                      />
                      <small className="text-muted">Exemplo: 1 234,56 MT</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="taxa_inscricao" className="form-label">
                        Taxa de Inscrição (MZN)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="taxa_inscricao"
                        name="taxa_inscricao"
                        value={configuracoes.taxa_inscricao}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                      />
                      <small className="text-muted">Valor padrão para inscrição em cursos</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="comissao_instrutor" className="form-label">
                        Comissão do Instrutor (%)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="comissao_instrutor"
                        name="comissao_instrutor"
                        value={configuracoes.comissao_instrutor}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                      <small className="text-muted">Percentual que o instrutor recebe das vendas</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="imposto_vat" className="form-label">
                        IVA/VAT (%)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="imposto_vat"
                        name="imposto_vat"
                        value={configuracoes.imposto_vat}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                      <small className="text-muted">Imposto sobre valor acrescentado (Moçambique: 16%)</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Email */}
            <div className="tab-pane fade" id="email" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Configurações de Email</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email_host" className="form-label">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="email_host"
                        name="email_host"
                        value={configuracoes.email_host}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email_port" className="form-label">
                        Porta SMTP
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="email_port"
                        name="email_port"
                        value={configuracoes.email_port}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email_user" className="form-label">
                        Usuário do Email
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="email_user"
                        name="email_user"
                        value={configuracoes.email_user}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email_pass" className="form-label">
                        Senha do Email
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="email_pass"
                        name="email_pass"
                        value={configuracoes.email_pass}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_secure"
                      name="email_secure"
                      checked={configuracoes.email_secure}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="email_secure">
                      <strong>Conexão Segura (SSL/TLS)</strong>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Tema */}
            <div className="tab-pane fade" id="tema" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Configurações de Tema</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_primaria" className="form-label">
                        Cor Primária
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_primaria"
                        name="cor_primaria"
                        value={configuracoes.cor_primaria}
                        onChange={handleChange}
                        title="Escolha a cor primária"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_secundaria" className="form-label">
                        Cor Secundária
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_secundaria"
                        name="cor_secundaria"
                        value={configuracoes.cor_secundaria}
                        onChange={handleChange}
                        title="Escolha a cor secundária"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_sucesso" className="form-label">
                        Cor de Sucesso
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_sucesso"
                        name="cor_sucesso"
                        value={configuracoes.cor_sucesso}
                        onChange={handleChange}
                        title="Escolha a cor de sucesso"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_perigo" className="form-label">
                        Cor de Perigo
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_perigo"
                        name="cor_perigo"
                        value={configuracoes.cor_perigo}
                        onChange={handleChange}
                        title="Escolha a cor de perigo"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_aviso" className="form-label">
                        Cor de Aviso
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_aviso"
                        name="cor_aviso"
                        value={configuracoes.cor_aviso}
                        onChange={handleChange}
                        title="Escolha a cor de aviso"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cor_info" className="form-label">
                        Cor de Informação
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="cor_info"
                        name="cor_info"
                        value={configuracoes.cor_info}
                        onChange={handleChange}
                        title="Escolha a cor de informação"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="favicon_url" className="form-label">
                        URL do Favicon
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        id="favicon_url"
                        name="favicon_url"
                        value={configuracoes.favicon_url}
                        onChange={handleChange}
                        placeholder="https://exemplo.com/favicon.ico"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Legal */}
            <div className="tab-pane fade" id="legal" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Configurações Legais</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="termos_uso" className="form-label">
                      Termos de Uso
                    </label>
                    <textarea
                      className="form-control"
                      id="termos_uso"
                      name="termos_uso"
                      value={configuracoes.termos_uso}
                      onChange={handleChange}
                      rows="8"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="politica_privacidade" className="form-label">
                      Política de Privacidade
                    </label>
                    <textarea
                      className="form-control"
                      id="politica_privacidade"
                      name="politica_privacidade"
                      value={configuracoes.politica_privacidade}
                      onChange={handleChange}
                      rows="8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Salvar Geral */}
          <div className="mt-4">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={fetchConfiguracoes}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar Alterações
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
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
                    Salvar Todas as Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}