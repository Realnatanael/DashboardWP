import { config } from '../config.js';

function buildAuthHeaders() {
  const headers = { Accept: 'application/json' };

  if (config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  } else if (config.apiUser && config.apiPassword) {
    const encoded = Buffer.from(`${config.apiUser}:${config.apiPassword}`).toString('base64');
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

async function apiGet(path, params = {}) {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${path} retornou ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function firstDayOfMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function fetchEmpresas() {
  const data = await apiGet('/INTEGRACAO/EMPRESAS', { limite: 2000 });
  return data.resultados || [];
}

export async function fetchVendasHoje(empresaCodigo) {
  const params = {
    dataInicial: todayISO(),
    dataFinal: todayISO(),
    situacao: 'A',
    limite: 2000,
  };
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  const data = await apiGet('/INTEGRACAO/VENDA', params);
  return data.resultados || [];
}

export async function fetchVendaResumo(empresaCodigos) {
  const params = {
    dataInicial: todayISO(),
    dataFinal: todayISO(),
    situacao: 'A',
  };
  if (empresaCodigos?.length) {
    params.empresaCodigo = empresaCodigos.join(',');
  }

  return apiGet('/INTEGRACAO/VENDA_RESUMO', params);
}

export async function fetchTanques(empresaCodigo) {
  const params = { limite: 2000 };
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  const data = await apiGet('/INTEGRACAO/TANQUE', params);
  return data.resultados || [];
}

export async function fetchEstoque(empresaCodigo) {
  const data = await apiGet('/INTEGRACAO/PRODUTO_ESTOQUE', {
    empresaCodigo,
    limite: 2000,
  });
  return data.resultados || [];
}

export async function fetchMapaDesempenho(empresaCodigo) {
  const params = {
    dataInicial: todayISO(),
    dataFinal: todayISO(),
  };
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  return apiGet('/INTEGRACAO/MAPA_DESEMPENHO', params);
}

export async function fetchDRE(filiais) {
  const params = {
    dataInicial: firstDayOfMonthISO(),
    dataFinal: todayISO(),
  };
  if (filiais?.length) {
    params.filiais = filiais.join(',');
  }

  return apiGet('/INTEGRACAO/DRE', params);
}
