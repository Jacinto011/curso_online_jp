// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  // Funções para gerenciar token
  const setToken = (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
    }
  };

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const removeToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    }
  };

  // Verificar autenticação ao carregar
  const checkAuth = useCallback(async () => {
    try {
      const token = getToken();
      if (token) {
        // Configurar token no cabeçalho da API
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.get('/auth/me');
        
        if (response.data.success) {
          setUser(response.data.user || response.data.data?.usuario);
        } else {
          // Token inválido ou usuário não encontrado
          removeToken();
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error.response?.data || error.message);
      
      // Limpar tokens inválidos
      removeToken();
      delete api.defaults.headers.common['Authorization'];
      
      // Se não for erro 401 (Unauthorized), manter usuário deslogado
      if (error.response?.status !== 401) {
        console.error('Erro desconhecido na autenticação:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Função para buscar notificações
  const fetchNotificacoes = async () => {
    if (user) {
      try {
        const response = await api.get('/notificacoes');
        
        // CORREÇÃO: A API agora retorna { success: true, data: { notificacoes: [] } }
        const notificacoesData = response.data.success 
          ? (response.data.data?.notificacoes || [])
          : (response.data.notificacoes || []);
        
        setNotificacoes(notificacoesData);
        
        // Calcular não lidas
        const naoLidas = notificacoesData.filter(n => !n.lida).length;
        setNotificacoesNaoLidas(naoLidas);
        
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        // Se falhar, tentar o formato antigo como fallback
        if (error.response?.data?.notificacoes) {
          const notificacoesData = error.response.data.notificacoes;
          setNotificacoes(notificacoesData);
          setNotificacoesNaoLidas(notificacoesData.filter(n => !n.lida).length);
        }
      }
    }
  };

  // Chamar no useEffect quando autenticado
  useEffect(() => {
    if (user) {
      fetchNotificacoes();
      const intervalo = setInterval(fetchNotificacoes, 30000);
      return () => clearInterval(intervalo);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data.success) {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao fazer login' 
        };
      }
      
      const { token, user } = response.data;
      
      // Armazenar token
      setToken(token);
      
      // Configurar cabeçalho para próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Buscar notificações após login
      fetchNotificacoes();
      
      // Redirecionar baseado no papel
      switch(user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'instructor':
          router.push('/instructor');
          break;
        default:
          router.push('/student');
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      return { 
        success: false, 
        message 
      };
    }
  };

  const logout = () => {
    removeToken();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setNotificacoes([]);
    setNotificacoesNaoLidas(0);
    router.push('/auth/login');
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { 
        success: response.data.success || true, 
        data: response.data,
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registrar' 
      };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      if (response.data.success) {
        setUser(response.data.user || response.data.data?.usuario);
      }
      return { 
        success: response.data.success || true, 
        data: response.data,
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  };

  const requestInstructorRole = async (mensagem) => {
    try {
      const response = await api.post('/auth/request-instructor', { mensagem });
      return { 
        success: response.data.success || true, 
        data: response.data,
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao solicitar papel de instrutor' 
      };
    }
  };

  // Funções para gerenciar notificações
  const marcarComoLida = async (notificacaoId) => {
    try {
      const response = await api.put('/notificacoes', {
        notificacao_id: notificacaoId,
        acao: 'ler'
      });
      
      if (response.data.success) {
        setNotificacoes(prev =>
          prev.map(n =>
            n.id === notificacaoId ? { ...n, lida: 1, data_leitura: new Date().toISOString() } : n
          )
        );
        setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const response = await api.put('/notificacoes', { marcar_todas: true });
      if (response.data.success) {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: 1 })));
        setNotificacoesNaoLidas(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
    requestInstructorRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isInstructor: user?.role === 'instructor',
    isStudent: user?.role === 'student',
    notificacoes,
    notificacoesNaoLidas,
    fetchNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    refreshUser: checkAuth // Adicionar função para atualizar dados do usuário
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};