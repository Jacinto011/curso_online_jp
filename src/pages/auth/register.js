import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  // Estado para controlar o passo atual
  const [currentStep, setCurrentStep] = useState(1);
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
  
  // Estado para termos e condições
  const [termsAccepted, setTermsAccepted] = useState({
    termos_uso: false,
    politica_privacidade: false,
    comunicacoes: false
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDadosBancarios, setShowDadosBancarios] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const { register } = useAuth();
  const router = useRouter();

  const bancosMocambique = [
    { codigo: 'bci', nome: 'Banco BCI' },
    { codigo: 'standard', nome: 'Standard Bank' },
    { codigo: 'bim', nome: 'Millennium BIM' },
    { codigo: 'absa', nome: 'Absa Bank' },
    { codigo: 'ecobank', nome: 'Ecobank' },
    { codigo: 'outro', nome: 'Outro Banco' }
  ];

  // Definição dos passos
  const steps = {
    student: [
      { id: 1, title: 'Dados Pessoais', description: 'Informações básicas' },
      { id: 2, title: 'Segurança', description: 'Crie sua senha' },
      { id: 3, title: 'Confirmação', description: 'Termos e condições' }
    ],
    instructor: [
      { id: 1, title: 'Dados Pessoais', description: 'Informações básicas' },
      { id: 2, title: 'Dados Bancários', description: 'Recebimento de pagamentos' },
      { id: 3, title: 'Segurança', description: 'Crie sua senha' },
      { id: 4, title: 'Confirmação', description: 'Termos e condições' }
    ]
  };

  const currentSteps = formData.role === 'student' ? steps.student : steps.instructor;
  const totalSteps = currentSteps.length;

  // Validação do passo atual
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1: // Dados Pessoais
        if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
        if (!formData.email.trim()) errors.email = 'Email é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';
        if (!formData.telefone.trim()) errors.telefone = 'Telefone é obrigatório';
        break;
        
      case 2: 
        if (formData.role === 'instructor') {
          // Validação de dados bancários para instrutores
          const temMetodoPagamento = 
            dadosBancarios.banco_nome || 
            dadosBancarios.mpesa_numero || 
            dadosBancarios.emola_numero || 
            dadosBancarios.airtel_money_numero;
          
          if (!temMetodoPagamento) {
            errors.geral = 'Selecione pelo menos um método de recebimento';
          }
          
          // Validação específica para conta bancária
          if (dadosBancarios.banco_nome && (!dadosBancarios.conta || !dadosBancarios.nome_titular)) {
            errors.conta = 'Para conta bancária, preencha número da conta e nome do titular';
          }
        } else {
          // Validação de senha para estudantes
          if (!formData.senha) errors.senha = 'Senha é obrigatória';
          else if (formData.senha.length < 6) errors.senha = 'Mínimo 6 caracteres';
        }
        break;
        
      case 3:
        if (formData.role === 'student') {
          if (!formData.senha) errors.senha = 'Senha é obrigatória';
          else if (formData.senha.length < 6) errors.senha = 'Mínimo 6 caracteres';
          if (formData.senha !== formData.confirmarSenha) errors.confirmarSenha = 'Senhas não coincidem';
        } else {
          // Instrutores validam senha no passo 3
          if (!formData.senha) errors.senha = 'Senha é obrigatória';
          else if (formData.senha.length < 6) errors.senha = 'Mínimo 6 caracteres';
          if (formData.senha !== formData.confirmarSenha) errors.confirmarSenha = 'Senhas não coincidem';
        }
        break;
        
      case 4: // Confirmação (apenas para instrutores)
        if (!termsAccepted.termos_uso || !termsAccepted.politica_privacidade) {
          errors.terms = 'Você deve aceitar os Termos de Uso e Política de Privacidade';
        }
        break;
    }
    
    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep(currentStep);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setFormErrors({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
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

  const handleTermsChange = (term) => {
    setTermsAccepted(prev => ({
      ...prev,
      [term]: !prev[term]
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Preparar dados para envio
      const { confirmarSenha, ...userData } = formData;
      const dadosCompletos = {
        ...userData,
        dados_bancarios: formData.role === 'instructor' ? dadosBancarios : null,
        termos_aceitos: termsAccepted
      };
      
      const result = await register(dadosCompletos);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(result.message);
        setCurrentStep(1); // Volta para o primeiro passo em caso de erro
      }
    } catch (err) {
      setError('Ocorreu um erro ao criar a conta');
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar passo atual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h4 className="step-title">Informações Pessoais</h4>
            <p className="step-description">Preencha seus dados básicos para começar</p>
            
            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.nome ? 'error' : ''}`}
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Seu nome completo"
                />
                {formErrors.nome && <div className="error-message">{formErrors.nome}</div>}
              </div>
              
              <div className="col-md-6 mb-4">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu@email.com"
                />
                {formErrors.email && <div className="error-message">{formErrors.email}</div>}
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="form-label">Telefone *</label>
                <input
                  type="tel"
                  className={`form-input ${formErrors.telefone ? 'error' : ''}`}
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  placeholder="+258 XX XXX XXXX"
                />
                {formErrors.telefone && <div className="error-message">{formErrors.telefone}</div>}
              </div>
              
              <div className="col-md-6 mb-4">
                <label className="form-label">Tipo de Conta *</label>
                <div className="role-selector">
                  <div 
                    className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}
                    onClick={() => {
                      handleChange({ target: { name: 'role', value: 'student' } });
                      setShowDadosBancarios(false);
                    }}
                  >
                    <div className="role-icon">🎓</div>
                    <div className="role-info">
                      <div className="role-title">Estudante</div>
                      <div className="role-desc">Quero aprender e me desenvolver</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`role-option ${formData.role === 'instructor' ? 'selected' : ''}`}
                    onClick={() => {
                      handleChange({ target: { name: 'role', value: 'instructor' } });
                      setShowDadosBancarios(true);
                    }}
                  >
                    <div className="role-icon">👨‍🏫</div>
                    <div className="role-info">
                      <div className="role-title">Instrutor</div>
                      <div className="role-desc">Quero ensinar e compartilhar conhecimento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="form-label">Sobre você (Opcional)</label>
              <textarea
                className="form-input"
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Conte-nos um pouco sobre você, seus interesses ou experiência..."
              />
            </div>
          </div>
        );
        
      case 2:
        if (formData.role === 'instructor') {
          return (
            <div className="step-content">
              <h4 className="step-title">Dados de Recebimento</h4>
              <p className="step-description">Configure como deseja receber os pagamentos dos seus cursos</p>
              
              {formErrors.geral && (
                <div className="error-message mb-4">{formErrors.geral}</div>
              )}
              
              <div className="payment-methods">
                {/* Bancos Tradicionais */}
                <div className="method-section">
                  <h6 className="method-title">
                    <span className="method-icon">🏦</span>
                    Conta Bancária
                  </h6>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Banco</label>
                      <select
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
                        name="nome_titular"
                        value={dadosBancarios.nome_titular}
                        onChange={handleDadosBancariosChange}
                        placeholder="Nome completo como está no banco"
                      />
                    </div>
                  </div>
                </div>

                {/* Carteiras Digitais */}
                <div className="method-section">
                  <h6 className="method-title">
                    <span className="method-icon">📱</span>
                    Carteiras Digitais
                  </h6>
                  
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">
                        <span className="wallet-icon mpesa">M</span>
                        M-Pesa
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        name="mpesa_numero"
                        value={dadosBancarios.mpesa_numero}
                        onChange={handleDadosBancariosChange}
                        placeholder="+258 XX XXX XXXX"
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label">
                        <span className="wallet-icon emola">E</span>
                        e-Mola
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        name="emola_numero"
                        value={dadosBancarios.emola_numero}
                        onChange={handleDadosBancariosChange}
                        placeholder="+258 XX XXX XXXX"
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label">
                        <span className="wallet-icon airtel">A</span>
                        Airtel Money
                      </label>
                      <input
                        type="text"
                        className="form-input"
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
                    className="form-input"
                    name="telefone_titular"
                    value={dadosBancarios.telefone_titular}
                    onChange={handleDadosBancariosChange}
                    placeholder="+258 XX XXX XXXX"
                  />
                  <small className="form-help">
                    Usaremos para confirmar transações importantes
                  </small>
                </div>

                <div className="info-box">
                  <div className="info-icon">ℹ️</div>
                  <div className="info-content">
                    <strong>Importante:</strong> Estes dados são essenciais para receber os pagamentos dos seus cursos.
                    Mantenha-os atualizados. A plataforma retém 10% de comissão sobre cada venda.
                  </div>
                </div>
              </div>
            </div>
          );
        } else {
          // Passo 2 para estudantes é segurança
          return renderSecurityStep();
        }
        
      case 3:
        if (formData.role === 'student') {
          // Passo 3 para estudantes é confirmação
          return renderConfirmationStep();
        } else {
          // Passo 3 para instrutores é segurança
          return renderSecurityStep();
        }
        
      case 4:
        // Passo 4 apenas para instrutores (confirmação)
        return renderConfirmationStep();
        
      default:
        return null;
    }
  };

  const renderSecurityStep = () => (
    <div className="step-content">
      <h4 className="step-title">Segurança da Conta</h4>
      <p className="step-description">Crie uma senha segura para proteger sua conta</p>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <label className="form-label">Senha *</label>
          <div className="password-input-container">
            <input
              type="password"
              className={`form-input ${formErrors.senha ? 'error' : ''}`}
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {formErrors.senha && <div className="error-message">{formErrors.senha}</div>}
          
          <div className="password-strength">
            <div className={`strength-bar ${formData.senha.length >= 6 ? 'strong' : 'weak'}`}></div>
            <div className="strength-text">
              {formData.senha.length >= 6 ? 'Senha forte' : 'Senha fraca'}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <label className="form-label">Confirmar Senha *</label>
          <div className="password-input-container">
            <input
              type="password"
              className={`form-input ${formErrors.confirmarSenha ? 'error' : ''}`}
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
              placeholder="Digite novamente"
            />
          </div>
          {formErrors.confirmarSenha && (
            <div className="error-message">{formErrors.confirmarSenha}</div>
          )}
        </div>
      </div>
      
      <div className="security-tips">
        <h6 className="tips-title">Dicas para uma senha segura:</h6>
        <ul className="tips-list">
          <li className={formData.senha.length >= 6 ? 'valid' : ''}>
            Use pelo menos 6 caracteres
          </li>
          <li className={/\d/.test(formData.senha) ? 'valid' : ''}>
            Inclua números
          </li>
          <li className={/[A-Z]/.test(formData.senha) ? 'valid' : ''}>
            Use letras maiúsculas e minúsculas
          </li>
          <li className={/[!@#$%^&*]/.test(formData.senha) ? 'valid' : ''}>
            Adicione caracteres especiais
          </li>
        </ul>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="step-content">
      <h4 className="step-title">Confirmação Final</h4>
      <p className="step-description">Revise e aceite os termos para concluir o cadastro</p>
      
      {/* Resumo dos dados */}
      <div className="data-summary">
        <div className="summary-section">
          <h6 className="summary-title">Dados Pessoais</h6>
          <div className="summary-item">
            <span className="item-label">Nome:</span>
            <span className="item-value">{formData.nome}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Email:</span>
            <span className="item-value">{formData.email}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Telefone:</span>
            <span className="item-value">{formData.telefone}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Tipo de Conta:</span>
            <span className="item-value">
              {formData.role === 'student' ? 'Estudante' : 'Instrutor'}
            </span>
          </div>
        </div>
        
        {formData.role === 'instructor' && (
          <div className="summary-section">
            <h6 className="summary-title">Dados de Recebimento</h6>
            {dadosBancarios.banco_nome && (
              <div className="summary-item">
                <span className="item-label">Banco:</span>
                <span className="item-value">
                  {bancosMocambique.find(b => b.codigo === dadosBancarios.banco_nome)?.nome}
                </span>
              </div>
            )}
            {dadosBancarios.mpesa_numero && (
              <div className="summary-item">
                <span className="item-label">M-Pesa:</span>
                <span className="item-value">{dadosBancarios.mpesa_numero}</span>
              </div>
            )}
            {dadosBancarios.emola_numero && (
              <div className="summary-item">
                <span className="item-label">e-Mola:</span>
                <span className="item-value">{dadosBancarios.emola_numero}</span>
              </div>
            )}
            {dadosBancarios.airtel_money_numero && (
              <div className="summary-item">
                <span className="item-label">Airtel Money:</span>
                <span className="item-value">{dadosBancarios.airtel_money_numero}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Termos e Condições */}
      <div className="terms-section">
        <h6 className="terms-title">Termos e Condições</h6>
        
        <div className="terms-list">
          <div 
            className={`term-item ${termsAccepted.termos_uso ? 'accepted' : ''}`}
            onClick={() => handleTermsChange('termos_uso')}
          >
            <div className="term-checkbox">
              {termsAccepted.termos_uso ? '✓' : ''}
            </div>
            <div className="term-content">
              <strong>Termos de Uso *</strong>
              <p className="term-description">
                Concordo com os Termos de Uso da plataforma Curso Online JP
                <a href="/termos-de-uso" target="_blank" className="term-link">
                  (Ler termos completos)
                </a>
              </p>
            </div>
          </div>
          
          <div 
            className={`term-item ${termsAccepted.politica_privacidade ? 'accepted' : ''}`}
            onClick={() => handleTermsChange('politica_privacidade')}
          >
            <div className="term-checkbox">
              {termsAccepted.politica_privacidade ? '✓' : ''}
            </div>
            <div className="term-content">
              <strong>Política de Privacidade *</strong>
              <p className="term-description">
                Concordo com a Política de Privacidade e tratamento de dados
                <a href="/privacidade" target="_blank" className="term-link">
                  (Ler política completa)
                </a>
              </p>
            </div>
          </div>
          
          <div 
            className={`term-item ${termsAccepted.comunicacoes ? 'accepted' : ''}`}
            onClick={() => handleTermsChange('comunicacoes')}
          >
            <div className="term-checkbox">
              {termsAccepted.comunicacoes ? '✓' : ''}
            </div>
            <div className="term-content">
              <strong>Comunicações (Opcional)</strong>
              <p className="term-description">
                Aceito receber comunicações sobre novos cursos, ofertas e atualizações da plataforma
              </p>
            </div>
          </div>
        </div>
        
        {formErrors.terms && (
          <div className="error-message mt-3">{formErrors.terms}</div>
        )}
        
        <div className="terms-info">
          <div className="info-icon">ℹ️</div>
          <div className="info-text">
            Os campos marcados com * são obrigatórios para criação da conta
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="register-container">
      <style jsx global>{`
        .register-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .register-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%);
        }

        .register-card {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .register-header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          padding: 2rem;
          text-align: center;
          color: white;
        }

        .register-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .register-logo-icon {
          font-size: 2rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem;
          border-radius: 12px;
        }

        .register-logo-text {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .register-subtitle {
          font-size: 0.875rem;
          opacity: 0.9;
          max-width: 400px;
          margin: 0 auto;
        }

        /* Steps Navigation */
        .steps-container {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .steps-list {
          display: flex;
          justify-content: space-between;
          position: relative;
        }

        .steps-list::before {
          content: '';
          position: absolute;
          top: 16px;
          left: 0;
          right: 0;
          height: 2px;
          background: #e2e8f0;
          z-index: 1;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
        }

        .step-circle.completed {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
        }

        .step-circle.active {
          background: white;
          color: #2563eb;
          border: 2px solid #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .step-circle.inactive {
          background: #e2e8f0;
          color: #64748b;
        }

        .step-info {
          text-align: center;
        }

        .step-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .step-description-small {
          font-size: 0.625rem;
          color: #64748b;
        }

        .step-content {
          padding: 2rem;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .step-title-large {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #64748b;
          margin-bottom: 2rem;
        }

        /* Form Styles */
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          transition: all 0.3s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Role Selector */
        .role-selector {
          display: flex;
          gap: 1rem;
        }

        .role-option {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .role-option:hover {
          border-color: #cbd5e1;
        }

        .role-option.selected {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.05);
        }

        .role-icon {
          font-size: 1.5rem;
        }

        .role-info {
          flex: 1;
        }

        .role-title {
          font-weight: 600;
          color: #1e293b;
        }

        .role-desc {
          font-size: 0.75rem;
          color: #64748b;
        }

        /* Payment Methods */
        .payment-methods {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .method-section {
          margin-bottom: 1.5rem;
        }

        .method-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .method-icon {
          font-size: 1.25rem;
        }

        .wallet-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .wallet-icon.mpesa {
          background: #00b894;
          color: white;
        }

        .wallet-icon.emola {
          background: #0984e3;
          color: white;
        }

        .wallet-icon.airtel {
          background: #e84393;
          color: white;
        }

        .info-box {
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .info-icon {
          font-size: 1.25rem;
        }

        .info-content {
          flex: 1;
          font-size: 0.875rem;
          color: #1e293b;
        }

        /* Password Strength */
        .password-input-container {
          position: relative;
        }

        .password-strength {
          margin-top: 0.5rem;
        }

        .strength-bar {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-bottom: 0.25rem;
          position: relative;
          overflow: hidden;
        }

        .strength-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0;
          transition: width 0.3s;
        }

        .strength-bar.weak::after {
          width: 33%;
          background: #ef4444;
        }

        .strength-bar.medium::after {
          width: 66%;
          background: #f59e0b;
        }

        .strength-bar.strong::after {
          width: 100%;
          background: #10b981;
        }

        .strength-text {
          font-size: 0.75rem;
          color: #64748b;
        }

        .security-tips {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .tips-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tips-list li {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
          padding-left: 1.25rem;
          position: relative;
        }

        .tips-list li::before {
          content: '○';
          position: absolute;
          left: 0;
          color: #94a3b8;
        }

        .tips-list li.valid {
          color: #10b981;
        }

        .tips-list li.valid::before {
          content: '✓';
          color: #10b981;
        }

        /* Data Summary */
        .data-summary {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .summary-section {
          margin-bottom: 1rem;
        }

        .summary-section:last-child {
          margin-bottom: 0;
        }

        .summary-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .item-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .item-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e293b;
        }

        /* Terms and Conditions */
        .terms-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .terms-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }

        .terms-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .term-item {
          display: flex;
          gap: 0.75rem;
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 8px;
          transition: background 0.3s;
        }

        .term-item:hover {
          background: rgba(37, 99, 235, 0.05);
        }

        .term-item.accepted {
          background: rgba(16, 185, 129, 0.1);
        }

        .term-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .term-item.accepted .term-checkbox {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .term-content {
          flex: 1;
        }

        .term-content strong {
          display: block;
          font-size: 0.875rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .term-description {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.4;
        }

        .term-link {
          color: #2563eb;
          text-decoration: none;
          margin-left: 0.5rem;
          font-weight: 600;
        }

        .term-link:hover {
          text-decoration: underline;
        }

        .terms-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(37, 99, 235, 0.05);
          border-radius: 8px;
        }

        .info-text {
          font-size: 0.75rem;
          color: #2563eb;
        }

        /* Navigation Buttons */
        .step-navigation {
          display: flex;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .nav-button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .nav-button.back {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .nav-button.back:hover {
          background: #e2e8f0;
        }

        .nav-button.next {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
        }

        .nav-button.next:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .step-progress {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Success State */
        .success-state {
          padding: 3rem;
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          color: #10b981;
          margin-bottom: 1.5rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .success-message {
          color: #64748b;
          margin-bottom: 1.5rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .success-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Login Link */
        .login-link {
          text-align: center;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .login-link-text {
          color: #64748b;
          font-size: 0.875rem;
        }

        .login-link-text a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .login-link-text a:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .register-container {
            padding: 1rem;
          }
          
          .register-card {
            max-width: 100%;
          }
          
          .steps-container {
            padding: 1rem;
          }
          
          .step-content {
            padding: 1.5rem;
            min-height: auto;
          }
          
          .role-selector {
            flex-direction: column;
          }
          
          .step-navigation {
            padding: 1.5rem;
          }
          
          .success-state {
            padding: 2rem;
          }
        }

        @media (max-width: 480px) {
          .register-header {
            padding: 1.5rem;
          }
          
          .step-content {
            padding: 1rem;
          }
          
          .step-navigation {
            flex-direction: column;
            gap: 1rem;
          }
          
          .nav-button {
            width: 100%;
          }
        }
      `}</style>

      {/* Background */}
      <div className="register-bg"></div>

      {/* Card Principal */}
      <div className="register-card">
        {/* Cabeçalho */}
        <div className="register-header">
          <div className="register-logo">
            <div className="register-logo-icon">🎓</div>
            <div className="register-logo-text">Curso Online JP</div>
          </div>
          <p className="register-subtitle">
            {success 
              ? 'Conta criada com sucesso!' 
              : 'Crie sua conta e comece sua jornada de aprendizado'}
          </p>
        </div>

        {success ? (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h3 className="success-title">Conta criada com sucesso!</h3>
            <p className="success-message">
              Sua conta foi criada com sucesso. Você será redirecionado para a página de login em instantes.
            </p>
            <div className="success-spinner"></div>
          </div>
        ) : (
          <>
            {/* Navegação de Passos */}
            <div className="steps-container">
              <div className="steps-list">
                {currentSteps.map((step, index) => {
                  const stepNumber = index + 1;
                  let status = 'inactive';
                  if (stepNumber < currentStep) status = 'completed';
                  if (stepNumber === currentStep) status = 'active';
                  
                  return (
                    <div key={step.id} className="step-item">
                      <div className={`step-circle ${status}`}>
                        {stepNumber}
                      </div>
                      <div className="step-info">
                        <div className="step-title">{step.title}</div>
                        <div className="step-description-small">{step.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo do Passo Atual */}
            {error && (
              <div className="error-message" style={{ margin: '1rem 2rem 0', background: '#fee' }}>
                ⚠️ {error}
              </div>
            )}
            
            {renderStep()}

            {/* Navegação */}
            <div className="step-navigation">
              <button
                className="nav-button back"
                onClick={handlePreviousStep}
                disabled={currentStep === 1 || loading}
              >
                ← Voltar
              </button>
              
              <div className="step-progress">
                Passo {currentStep} de {totalSteps}
              </div>
              
              <button
                className="nav-button next"
                onClick={handleNextStep}
                disabled={loading}
              >
                {currentStep === totalSteps ? (
                  loading ? 'Criando conta...' : 'Criar Conta'
                ) : (
                  'Próximo →'
                )}
              </button>
            </div>

            {/* Link para Login */}
            <div className="login-link">
              <p className="login-link-text">
                Já tem uma conta?{' '}
                <Link href="/auth/login">Faça login aqui</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}