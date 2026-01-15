import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    bio: '',
    role: 'student'
  });
  
  // Dados bancários (apenas para instrutores)
  const [dadosBancarios, setDadosBancarios] = useState({
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
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDadosBancarios, setShowDadosBancarios] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Se mudar para instructor, mostrar dados bancários
    if (name === 'role' && value === 'instructor') {
      setShowDadosBancarios(true);
    } else if (name === 'role' && value === 'student') {
      setShowDadosBancarios(false);
    }
  };

  const handleDadosBancariosChange = (e) => {
    const { name, value } = e.target;
    setDadosBancarios(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações básicas
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    // Validação para instrutores
    if (formData.role === 'instructor') {
      // Verificar se tem pelo menos um método de pagamento
      const temMetodoPagamento = 
        dadosBancarios.banco_nome || 
        dadosBancarios.mpesa_numero || 
        dadosBancarios.emola_numero || 
        dadosBancarios.airtel_money_numero;
      
      if (!temMetodoPagamento) {
        setError('Instrutores devem cadastrar pelo menos um método de recebimento');
        setLoading(false);
        return;
      }
      
      // Validação de conta bancária se informada
      if (dadosBancarios.banco_nome) {
        if (!dadosBancarios.conta || !dadosBancarios.nome_titular) {
          setError('Para conta bancária, preencha número da conta e nome do titular');
          setLoading(false);
          return;
        }
      }
    }

    try {
      // Preparar dados para envio
      const { confirmarSenha, ...userData } = formData;
      const dadosCompletos = {
        ...userData,
        dados_bancarios: formData.role === 'instructor' ? dadosBancarios : null
      };
      
      const result = await register(dadosCompletos);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Ocorreu um erro ao criar a conta');
    } finally {
      setLoading(false);
    }
  };

  const bancosMocambique = [
    { codigo: 'bci', nome: 'Banco BCI' },
    { codigo: 'standard', nome: 'Standard Bank' },
    { codigo: 'bim', nome: 'Millennium BIM' },
    { codigo: 'absa', nome: 'Absa Bank' },
    { codigo: 'ecobank', nome: 'Ecobank' },
    { codigo: 'outro', nome: 'Outro Banco' }
  ];

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white text-center">
              <h3 className="mb-0">Criar Nova Conta</h3>
              <p className="mb-0">Junte-se à nossa plataforma de cursos</p>
            </div>
            
            <div className="card-body p-4">
              {success ? (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="mb-3">Conta criada com sucesso!</h4>
                  <p className="text-muted">
                    Sua conta foi criada com sucesso. Redirecionando para login...
                  </p>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="nome" className="form-label">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nome"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email *
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="senha" className="form-label">
                          Senha *
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="senha"
                          name="senha"
                          value={formData.senha}
                          onChange={handleChange}
                          required
                        />
                        <small className="form-text text-muted">
                          Mínimo 6 caracteres
                        </small>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="confirmarSenha" className="form-label">
                          Confirmar Senha *
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmarSenha"
                          name="confirmarSenha"
                          value={formData.confirmarSenha}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="telefone" className="form-label">
                          Telefone *
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          required
                          placeholder="+258 XX XXX XXXX"
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="role" className="form-label">
                          Tipo de Conta *
                        </label>
                        <select
                          className="form-select"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          required
                        >
                          <option value="student">Estudante</option>
                          <option value="instructor">Instrutor</option>
                        </select>
                        <small className="form-text text-muted">
                          Para se tornar instrutor, você precisa solicitar aprovação após criar a conta
                        </small>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="bio" className="form-label">
                        Sobre você
                      </label>
                      <textarea
                        className="form-control"
                        id="bio"
                        name="bio"
                        rows="3"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Conte-nos um pouco sobre você..."
                      />
                    </div>

                    {/* Dados Bancários para Instrutores */}
                    {showDadosBancarios && (
                      <div className="card border-primary mb-4">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">
                            <i className="bi bi-bank me-2"></i>
                            Dados de Recebimento (Instrutor)
                          </h5>
                          <small className="text-white-50">
                            Configure pelo menos um método para receber pagamentos dos seus cursos
                          </small>
                        </div>
                        <div className="card-body">
                          {/* Bancos Tradicionais */}
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
                                  value={dadosBancarios.banco_nome}
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
                                  value={dadosBancarios.agencia}
                                  onChange={handleDadosBancariosChange}
                                  placeholder="Ex: 1234"
                                />
                              </div>
                            </div>
                            
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">Número da Conta *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="conta"
                                  value={dadosBancarios.conta}
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
                                  value={dadosBancarios.nib}
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
                                  value={dadosBancarios.tipo_conta}
                                  onChange={handleDadosBancariosChange}
                                >
                                  <option value="corrente">Conta Corrente</option>
                                  <option value="poupanca">Conta Poupança</option>
                                </select>
                              </div>
                              
                              <div className="col-md-6 mb-3">
                                <label className="form-label">Nome do Titular *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="nome_titular"
                                  value={dadosBancarios.nome_titular}
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
                                  value={dadosBancarios.mpesa_numero}
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
                                  value={dadosBancarios.emola_numero}
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
                                  value={dadosBancarios.airtel_money_numero}
                                  onChange={handleDadosBancariosChange}
                                  placeholder="+258 XX XXX XXXX"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Telefone do Titular */}
                          <div className="mb-3">
                            <label className="form-label">Telefone para Confirmação</label>
                            <input
                              type="text"
                              className="form-control"
                              name="telefone_titular"
                              value={dadosBancarios.telefone_titular}
                              onChange={handleDadosBancariosChange}
                              placeholder="+258 XX XXX XXXX"
                            />
                            <small className="form-text text-muted">
                              Usaremos para confirmar transações importantes
                            </small>
                          </div>

                          <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Importante:</strong> Estes dados são essenciais para receber os pagamentos dos seus cursos.
                            Mantenha-os atualizados. A plataforma retém 10% de comissão sobre cada venda.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="d-grid gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Criando conta...
                          </>
                        ) : 'Criar Conta'}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <p className="mb-0">
                      Já tem uma conta?{' '}
                      <Link href="/auth/login" className="text-decoration-none fw-bold">
                        Faça login aqui
                      </Link>
                    </p>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
                    </small>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}