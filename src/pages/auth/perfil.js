import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function Perfil() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [detalhesUsuario, setDetalhesUsuario] = useState(null);
  
  // Estados para dados bancários
  const [editandoDadosBancarios, setEditandoDadosBancarios] = useState(false);
  const [formDadosBancarios, setFormDadosBancarios] = useState({
    banco_nome: '',
    banco_codigo: '',
    agencia: '',
    conta: '',
    nib: '',
    tipo_conta: 'corrente',
    nome_titular: '',
    telefone_titular: '',
    mpesa_numero: '',
    emola_numero: '',
    airtel_money_numero: ''
  });

  const bancosMocambique = [
    { codigo: 'bci', nome: 'Banco BCI' },
    { codigo: 'standard', nome: 'Standard Bank' },
    { codigo: 'bim', nome: 'Millennium BIM' },
    { codigo: 'absa', nome: 'Absa Bank' },
    { codigo: 'ecobank', nome: 'Ecobank' },
    { codigo: 'outro', nome: 'Outro Banco' }
  ];

  // Função para buscar dados do usuário
  const fetchDetalhesUsuario = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/detalhes');
      //console.log(response.data.data.usuario ? response.data.data : null)
      
      setDetalhesUsuario(response.data.data.usuario.nome ? response.data.data : null);
      setFormData({
        nome: response.data.data.usuario.nome || '',
        email: response.data.data.usuario.email || '',
        telefone: response.data.data.usuario.telefone || '',
        bio: response.data.data.usuario.bio || ''
      });
      
      // Se for instrutor e tiver dados bancários, carregar
      if (response.data.data.usuario.role === 'instructor' && response.data.data.dados_bancarios) {
        setFormDadosBancarios(response.data.data.dados_bancarios);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
      setErro('Erro ao carregar perfil');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar dados bancários
  const fetchDadosBancarios = async () => {
    try {
      const response = await api.get('/instructor/dados-bancarios');
      if (response.data) {
        console.log(response.data);
        
        setFormDadosBancarios(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados bancários:', error);
    }
  };

  // Atualizar useEffect para buscar dados do usuário
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchDetalhesUsuario();
  }, [isAuthenticated]);

  // Atualizar useEffect para buscar dados bancários
  useEffect(() => {
    if (isAuthenticated && user?.role === 'instructor') {
      fetchDadosBancarios();
    }
  }, [isAuthenticated, user?.role]);

  // Função auxiliar para nome do banco
  const getBancoNome = (codigo) => {
    const bancos = {
      'bci': 'Banco BCI',
      'standard': 'Standard Bank',
      'bim': 'Millennium BIM',
      'absa': 'Absa Bank',
      'ecobank': 'Ecobank'
    };
    return bancos[codigo] || codigo;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDadosBancariosChange = (e) => {
    const { name, value } = e.target;
    setFormDadosBancarios(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPerfil = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setSucesso('Perfil atualizado com sucesso!');
        setEditing(false);
        setTimeout(() => setSucesso(''), 3000);
        fetchDetalhesUsuario(); // Recarregar dados
      } else {
        setErro(result.message);
        setTimeout(() => setErro(''), 3000);
      }
    } catch (error) {
      setErro('Erro ao atualizar perfil');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleSubmitDadosBancarios = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/instructor/dados-bancarios', formDadosBancarios);
      if (response.data.success) {
        setSucesso('Dados bancários atualizados com sucesso!');
        setEditandoDadosBancarios(false);
        setTimeout(() => setSucesso(''), 3000);
        fetchDadosBancarios(); // Recarregar dados
      } else {
        setErro(response.data.message || 'Erro ao atualizar dados bancários');
        setTimeout(() => setErro(''), 3000);
      }
    } catch (error) {
      setErro('Erro ao atualizar dados bancários');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleSubmitSenha = async (e) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres');
      setTimeout(() => setErro(''), 3000);
      return;
    }

    try {
      const response = await api.put('/auth/alterar-senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      });
      
      if (response.data.success) {
        setSucesso('Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        setErro(response.data.message);
        setTimeout(() => setErro(''), 3000);
      }
    } catch (error) {
      setErro('Erro ao alterar senha');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleSolicitarInstrutor = async () => {
    const mensagem = prompt('Por que você deseja se tornar um instrutor?');
    if (!mensagem) return;

    try {
      const response = await api.post('/auth/solicitar-instrutor', { mensagem });
      if (response.data.success) {
        setSucesso('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
        setTimeout(() => setSucesso(''), 5000);
      }
    } catch (error) {
      setErro('Erro ao enviar solicitação');
      setTimeout(() => setErro(''), 3000);
    }
  };

  if (loading || !detalhesUsuario) {
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
          {/* Cabeçalho */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">Meu Perfil</h1>
              <p className="text-muted mb-0">
                Gerencie suas informações pessoais e preferências
              </p>
            </div>
            <Link 
              href={user?.role === 'admin' ? '/admin' : 
                    user?.role === 'instructor' ? '/instructor' : '/student'}
              className="btn btn-outline-primary"
            >
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
            {/* Coluna da Esquerda - Informações do Perfil */}
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                         style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                      {detalhesUsuario.usuario.nome.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <h3>{detalhesUsuario.usuario.nome}</h3>
                  <p className="text-muted">{detalhesUsuario.usuario.email}</p>
                  
                  <div className="mb-3">
                    <span className={`badge bg-${getRoleColor(detalhesUsuario.usuario.role)}`}>
                      {getRoleLabel(detalhesUsuario.usuario.role)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      Membro desde {new Date(detalhesUsuario.usuario.data_criacao).toLocaleDateString('pt-BR')}
                    </small>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setEditing(true)}
                    >
                      <i className="bi bi-pencil me-2"></i>
                      Editar Perfil
                    </button>
                    
                    {detalhesUsuario.usuario.role === 'student' && (
                      <button 
                        className="btn btn-outline-success"
                        onClick={handleSolicitarInstrutor}
                      >
                        <i className="bi bi-person-badge me-2"></i>
                        Tornar-se Instrutor
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="card mt-4">
                <div className="card-header">
                  <h6 className="mb-0">Estatísticas</h6>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Cursos Inscritos</span>
                      <strong>0</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Cursos Concluídos</span>
                      <strong>0</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Certificados</span>
                      <strong>0</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Progresso Médio</span>
                      <strong>0%</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coluna da Direita - Formulários */}
            <div className="col-md-8">
              {editing ? (
                /* Formulário de Edição do Perfil */
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Editar Perfil</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmitPerfil}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="nome" className="form-label">Nome *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="nome"
                            name="nome"
                            value={formData.nome || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label htmlFor="email" className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="telefone" className="form-label">Telefone</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="telefone"
                          name="telefone"
                          value={formData.telefone || ''}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="bio" className="form-label">Sobre mim</label>
                        <textarea
                          className="form-control"
                          id="bio"
                          name="bio"
                          rows="4"
                          value={formData.bio || ''}
                          onChange={handleChange}
                          placeholder="Conte um pouco sobre você..."
                        />
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            setFormData({
                              nome: detalhesUsuario.usuario.nome,
                              email: detalhesUsuario.usuario.email,
                              telefone: detalhesUsuario.usuario.telefone || '',
                              bio: detalhesUsuario.usuario.bio || ''
                            });
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          <i className="bi bi-save me-2"></i>
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* Visualização das Informações */
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Informações Pessoais</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Nome Completo</label>
                        <p className="mb-0">{detalhesUsuario.usuario.nome}</p>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Email</label>
                        <p className="mb-0">{detalhesUsuario.usuario.email}</p>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Telefone</label>
                        <p className="mb-0">{detalhesUsuario.usuario.telefone || 'Não informado'}</p>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Papel na Plataforma</label>
                        <p className="mb-0">
                          <span className={`badge bg-${getRoleColor(detalhesUsuario.usuario.role)}`}>
                            {getRoleLabel(detalhesUsuario.usuario.role)}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label text-muted">Sobre mim</label>
                      <p className="mb-0">{detalhesUsuario.usuario.bio || 'Nenhuma informação fornecida.'}</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label text-muted">Data de Registro</label>
                      <p className="mb-0">
                        {new Date(detalhesUsuario.usuario.data_criacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados Bancários (apenas para instrutores) */}
              {user?.role === 'instructor' && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-bank me-2"></i>
                      Dados de Recebimento
                    </h5>
                  </div>
                  <div className="card-body">
                    {editandoDadosBancarios ? (
                      <form onSubmit={handleSubmitDadosBancarios}>
                        <div className="mb-4">
                          <h6 className="border-bottom pb-2">
                            <i className="bi bi-bank me-2"></i>
                            Conta Bancária (Opcional)
                          </h6>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Banco</label>
                              <select
                                className="form-select"
                                name="banco_nome"
                                value={formDadosBancarios.banco_nome}
                                onChange={handleDadosBancariosChange}
                              >
                                <option value="">Selecione um banco</option>
                                {bancosMocambique.map(banco => (
                                  <option key={banco.codigo} value={banco.codigo}>
                                    {banco.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Agência</label>
                              <input
                                type="text"
                                className="form-control"
                                name="agencia"
                                value={formDadosBancarios.agencia}
                                onChange={handleDadosBancariosChange}
                                placeholder="Ex: 1234"
                              />
                            </div>
                          </div>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Número da Conta</label>
                              <input
                                type="text"
                                className="form-control"
                                name="conta"
                                value={formDadosBancarios.conta}
                                onChange={handleDadosBancariosChange}
                                placeholder="Ex: 123456789"
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label className="form-label">NIB</label>
                              <input
                                type="text"
                                className="form-control"
                                name="nib"
                                value={formDadosBancarios.nib}
                                onChange={handleDadosBancariosChange}
                                placeholder="21 dígitos"
                              />
                            </div>
                          </div>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Tipo de Conta</label>
                              <select
                                className="form-select"
                                name="tipo_conta"
                                value={formDadosBancarios.tipo_conta}
                                onChange={handleDadosBancariosChange}
                              >
                                <option value="corrente">Conta Corrente</option>
                                <option value="poupanca">Conta Poupança</option>
                              </select>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Nome do Titular</label>
                              <input
                                type="text"
                                className="form-control"
                                name="nome_titular"
                                value={formDadosBancarios.nome_titular}
                                onChange={handleDadosBancariosChange}
                                placeholder="Nome completo como está no banco"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Carteiras Digitais */}
                        <div className="mb-4">
                          <h6 className="border-bottom pb-2">
                            <i className="bi bi-phone me-2"></i>
                            Carteiras Digitais (Opcional)
                          </h6>
                          
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label">
                                <i className="bi bi-phone text-success me-1"></i>
                                M-Pesa
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                name="mpesa_numero"
                                value={formDadosBancarios.mpesa_numero}
                                onChange={handleDadosBancariosChange}
                                placeholder="+258 XX XXX XXXX"
                              />
                            </div>
                            
                            <div className="col-md-4 mb-3">
                              <label className="form-label">
                                <i className="bi bi-wallet2 text-primary me-1"></i>
                                e-Mola
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                name="emola_numero"
                                value={formDadosBancarios.emola_numero}
                                onChange={handleDadosBancariosChange}
                                placeholder="+258 XX XXX XXXX"
                              />
                            </div>
                            
                            <div className="col-md-4 mb-3">
                              <label className="form-label">
                                <i className="bi bi-phone text-danger me-1"></i>
                                Airtel Money
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                name="airtel_money_numero"
                                value={formDadosBancarios.airtel_money_numero}
                                onChange={handleDadosBancariosChange}
                                placeholder="+258 XX XXX XXXX"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Telefone do Titular */}
                        <div className="mb-4">
                          <label className="form-label">Telefone para Confirmação</label>
                          <input
                            type="text"
                            className="form-control"
                            name="telefone_titular"
                            value={formDadosBancarios.telefone_titular}
                            onChange={handleDadosBancariosChange}
                            placeholder="+258 XX XXX XXXX"
                          />
                          <small className="form-text text-muted">
                            Usaremos para confirmar transações importantes
                          </small>
                        </div>

                        <div className="alert alert-info mb-4">
                          <i className="bi bi-info-circle me-2"></i>
                          <strong>Importante:</strong> Você precisa configurar pelo menos um método de pagamento para receber pelos seus cursos.
                        </div>

                        <div className="d-flex justify-content-between">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setEditandoDadosBancarios(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                          >
                            <i className="bi bi-save me-2"></i>
                            Salvar Dados Bancários
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {detalhesUsuario.dados_bancarios ? (
                          <div>
                            {/* Bancos Tradicionais */}
                            {detalhesUsuario.dados_bancarios.banco_nome && (
                              <div className="mb-4">
                                <h6>Conta Bancária</h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <p><strong>Banco:</strong> {getBancoNome(detalhesUsuario.dados_bancarios.banco_nome)}</p>
                                    <p><strong>Agência:</strong> {detalhesUsuario.dados_bancarios.agencia}</p>
                                    <p><strong>Conta:</strong> {detalhesUsuario.dados_bancarios.conta}</p>
                                  </div>
                                  <div className="col-md-6">
                                    <p><strong>NIB:</strong> {detalhesUsuario.dados_bancarios.nib || 'Não informado'}</p>
                                    <p><strong>Tipo:</strong> {detalhesUsuario.dados_bancarios.tipo_conta === 'corrente' ? 'Corrente' : 'Poupança'}</p>
                                    <p><strong>Titular:</strong> {detalhesUsuario.dados_bancarios.nome_titular}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Carteiras Digitais */}
                            <div className="mb-4">
                              <h6>Carteiras Digitais</h6>
                              <div className="row">
                                {detalhesUsuario.dados_bancarios.mpesa_numero && (
                                  <div className="col-md-4">
                                    <p>
                                      <strong>M-Pesa:</strong><br />
                                      {detalhesUsuario.dados_bancarios.mpesa_numero}
                                    </p>
                                  </div>
                                )}
                                {detalhesUsuario.dados_bancarios.emola_numero && (
                                  <div className="col-md-4">
                                    <p>
                                      <strong>e-Mola:</strong><br />
                                      {detalhesUsuario.dados_bancarios.emola_numero}
                                    </p>
                                  </div>
                                )}
                                {detalhesUsuario.dados_bancarios.airtel_money_numero && (
                                  <div className="col-md-4">
                                    <p>
                                      <strong>Airtel Money:</strong><br />
                                      {detalhesUsuario.dados_bancarios.airtel_money_numero}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="alert alert-info">
                              <i className="bi bi-info-circle me-2"></i>
                              Estes dados são usados para processar seus pagamentos. Mantenha-os atualizados.
                            </div>

                            <button 
                              className="btn btn-warning"
                              onClick={() => setEditandoDadosBancarios(true)}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Editar Dados Bancários
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <p className="text-muted">Nenhum dado bancário cadastrado</p>
                            <button 
                              className="btn btn-primary"
                              onClick={() => setEditandoDadosBancarios(true)}
                            >
                              <i className="bi bi-plus-circle me-2"></i>
                              Adicionar Dados Bancários
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Alterar Senha */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Alterar Senha</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmitSenha}>
                    <div className="mb-3">
                      <label htmlFor="senhaAtual" className="form-label">Senha Atual</label>
                      <input
                        type="password"
                        className="form-control"
                        id="senhaAtual"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="novaSenha" className="form-label">Nova Senha</label>
                      <input
                        type="password"
                        className="form-control"
                        id="novaSenha"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        required
                      />
                      <small className="form-text text-muted">
                        Mínimo 6 caracteres
                      </small>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="confirmarSenha" className="form-label">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmarSenha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => {
                          if (window.confirm('Deseja realmente sair da sua conta?')) {
                            logout();
                          }
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Sair
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        <i className="bi bi-key me-2"></i>
                        Alterar Senha
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="row mt-4">
                <div className="col-md-4 mb-3">
                  <Link href="/student/meus-cursos" className="btn btn-outline-primary w-100">
                    <i className="bi bi-book me-2"></i>
                    Meus Cursos
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link href="/student/certificados" className="btn btn-outline-success w-100">
                    <i className="bi bi-award me-2"></i>
                    Meus Certificados
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link href="/notificacoes" className="btn btn-outline-warning w-100">
                    <i className="bi bi-bell me-2"></i>
                    Notificações
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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