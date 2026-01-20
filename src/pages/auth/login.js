import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    
    // Verificar se há credenciais salvas
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    } else {
      // Salvar email se "Lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Redirecionar baseado no papel do usuário
      let redirectPath = '/';
      
      // Verificar se o resultado contém informações do usuário
      if (result.user) {
        const userRole = result.user.role;
        
        switch(userRole) {
          case 'student':
          case 'student':
            redirectPath = '/student';
            break;
          case 'instructor':
          case 'instrutor':
            redirectPath = '/instructor';
            break;
          case 'admin':
            redirectPath = '/admin';
            break;
          default:
            redirectPath = '/';
            break;
        }
      }
      
      // Verificar se há um caminho de redirecionamento na query
      const queryRedirect = router.query.redirect;
      if (queryRedirect && !queryRedirect.includes('dashboard')) {
        redirectPath = queryRedirect;
      }
      
      router.push(redirectPath);
    }
  } catch (err) {
    setError('Ocorreu um erro ao fazer login');
    console.error('Erro no login:', err);
  } finally {
    setLoading(false);
  }
};

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <div className="login-container">
      <style jsx global>{`
        :root {
          --primary-color: #2563eb;
          --primary-light: #dbeafe;
          --secondary-color: #1e40af;
          --light-color: #f8fafc;
          --dark-color: #1e293b;
          --gray-color: #64748b;
          --success-color: #10b981;
          --danger-color: #ef4444;
          --gradient-primary: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          --gradient-light: linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%);
        }

        .login-container {
          min-height: 100vh;
          background: var(--gradient-light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-bg-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(30, 64, 175, 0.1) 0%, transparent 50%);
          animation: pulse 15s infinite alternate;
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .login-card {
          width: 100%;
          max-width: 450px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .login-header {
          background: var(--gradient-primary);
          padding: 2.5rem 2rem;
          text-align: center;
          color: white;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .login-logo-icon {
          font-size: 2rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem;
          border-radius: 12px;
        }

        .login-logo-text {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .login-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .login-body {
          padding: 2.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--dark-color);
          font-size: 0.875rem;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input.error {
          border-color: var(--danger-color);
        }

        .password-input-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--gray-color);
          cursor: pointer;
          padding: 0.25rem;
          transition: color 0.3s;
        }

        .password-toggle:hover {
          color: var(--primary-color);
        }

        .remember-forgot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
        }

        .checkbox-input.checked {
          background: var(--primary-color);
          border-color: var(--primary-color);
        }

        .checkbox-input.checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: var(--gray-color);
        }

        .forgot-password {
          color: var(--primary-color);
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s;
        }

        .forgot-password:hover {
          color: var(--secondary-color);
        }

        .login-button {
          width: 100%;
          padding: 1rem;
          background: var(--gradient-primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-button.loading {
          position: relative;
          color: transparent;
        }

        .login-button.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .register-link {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s;
        }

        .register-link:hover {
          color: var(--secondary-color);
          text-decoration: underline;
        }

        .error-message {
          background: #fee;
          color: var(--danger-color);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: shake 0.5s;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .error-message::before {
          content: '⚠️';
        }

        .social-login {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .social-login-title {
          text-align: center;
          color: var(--gray-color);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .social-buttons {
          display: flex;
          gap: 1rem;
        }

        .social-button {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: var(--dark-color);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .social-button:hover {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: var(--primary-color);
          opacity: 0.1;
          animation: float 20s infinite linear;
        }

        .floating-shape:nth-child(1) {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .floating-shape:nth-child(2) {
          width: 150px;
          height: 150px;
          bottom: 15%;
          right: 10%;
          animation-delay: 5s;
          background: var(--secondary-color);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(0) rotate(180deg); }
          75% { transform: translateY(20px) rotate(270deg); }
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 1rem;
          }
          
          .login-card {
            max-width: 100%;
          }
          
          .login-body {
            padding: 2rem 1.5rem;
          }
          
          .social-buttons {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .login-header {
            padding: 2rem 1.5rem;
          }
          
          .login-body {
            padding: 1.5rem;
          }
          
          .remember-forgot {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>

      {/* Background animado */}
      <div className="login-bg-animation"></div>
      
      {/* Elementos flutuantes decorativos */}
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>

      {/* Card de Login */}
      <div className={`login-card ${isVisible ? 'fade-in-up' : ''}`}>
        {/* Cabeçalho */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">🎓</div>
            <div className="login-logo-text">Curso Online JP</div>
          </div>
          <p className="login-subtitle">Acesse sua conta para continuar aprendendo</p>
        </div>

        {/* Corpo do Formulário */}
        <div className="login-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className={`form-input ${error ? 'error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Campo Senha */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Senha
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`form-input ${error ? 'error' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Lembrar-me e Esqueci a senha */}
            <div className="remember-forgot">
              <div 
                className="checkbox-container"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`checkbox-input ${rememberMe ? 'checked' : ''}`} />
                <span className="checkbox-label">Lembrar-me</span>
              </div>
              
              <button
                type="button"
                className="forgot-password"
                onClick={handleForgotPassword}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'Entrar na Conta'}
            </button>
          </form>

          {/* Link para Registro */}
          <div className="login-footer">
            <span style={{ color: 'var(--gray-color)' }}>
              Não tem uma conta?{' '}
            </span>
            <Link href="/auth/register" className="register-link">
              Registre-se agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}