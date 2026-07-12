import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard`);
      if (!res.ok) throw new Error('Aguardando primeira sincronização...');
      const json = await res.json();
      setData(json);
      setLastUpdate(json.geradoEm);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitial();

    const socket = io(API_URL || undefined, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('dashboard:update', (payload) => {
      setData(payload);
      setLastUpdate(payload.geradoEm);
      setError(null);
      setLoading(false);
    });

    socket.on('dashboard:error', (err) => {
      setError(err.message);
    });

    return () => socket.disconnect();
  }, [fetchInitial]);

  return { data, loading, error, connected, lastUpdate };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function formatLiters(value) {
  return `${formatNumber(value, 0)} L`;
}

export function formatPercent(value) {
  return `${formatNumber(value, 1)}%`;
}

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
