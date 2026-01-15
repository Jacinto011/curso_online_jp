import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useNotifications() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Polling a cada 30 segundos para novas notificações
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notificacoes');
      setNotificacoes(response.data);
      setNaoLidas(response.data.filter(n => !n.lida).length);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await api.put(`/api/notificacoes/${id}/ler`);
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  return {
    notificacoes,
    naoLidas,
    marcarComoLida,
    atualizar: fetchNotifications
  };
}