// Importa as configurações da aplicação, como URLs e credenciais da API.
import { config } from '../config.js';

// Esta função constrói os "cabeçalhos de autenticação".
// Pense neles como as credenciais (usuário/senha ou um token) necessárias para provar
// à API que temos permissão para pedir dados.
function buildAuthHeaders() {
  const headers = { Accept: 'application/json' };

  // Se um "token de API" estiver configurado, usa o método "Bearer" (Portador).
  if (config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  } else if (config.apiUser && config.apiPassword) { // Senão, se usuário e senha estiverem configurados, usa o método "Basic".
    const encoded = Buffer.from(`${config.apiUser}:${config.apiPassword}`).toString('base64');
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

// Função genérica para fazer uma requisição do tipo "GET" (buscar dados) na API.
// path: O "endereço" do recurso que queremos buscar (ex: /INTEGRACAO/EMPRESAS).
// params: Um objeto com os filtros para a busca (ex: { dataInicial: '2023-01-01' }).
async function apiGet(path, params = {}) {
  // Cria a URL base e adiciona o caminho do recurso.
  const url = new URL(`${config.apiBaseUrl}${path}`);
  // Adiciona cada filtro da busca na URL.
  Object.entries(params).forEach(([key, value]) => {
    // Só adiciona o filtro se ele tiver um valor válido.
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  // Realiza a chamada para a API usando a URL construída e os cabeçalhos de autenticação.
  const response = await fetch(url.toString(), {
    headers: buildAuthHeaders(),
  });

  // Se a resposta da API não for de sucesso (ex: erro 404 ou 500),
  // cria uma mensagem de erro clara e a dispara.
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${path} retornou ${response.status}: ${body.slice(0, 200)}`);
  }

  // Se a resposta for bem-sucedida, converte o corpo da resposta de texto (JSON) para um objeto JavaScript.
  return response.json();
}

// Função auxiliar para obter a data de hoje no formato 'AAAA-MM-DD', que a API espera.
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Função auxiliar para obter o primeiro dia do mês atual no formato 'AAAA-MM-DD'.
function firstDayOfMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Busca a lista de todas as empresas (postos) cadastradas na API.
export async function fetchEmpresas() {
  const data = await apiGet('/INTEGRACAO/EMPRESAS', { limite: 2000 });
  // Retorna a lista de resultados, ou uma lista vazia se não houver resultados.
  return data.resultados || [];
}

// Busca os dados de vendas de hoje.
export async function fetchVendasHoje(empresaCodigo) {
  const params = {
    dataInicial: todayISO(), // Filtra pela data de hoje.
    dataFinal: todayISO(),   // Filtra pela data de hoje.
    situacao: 'A',           // 'A' significa que queremos apenas vendas "Autorizadas".
    limite: 2000,            // Define um limite alto para garantir que todas as vendas do dia sejam trazidas.
  };
  // Se um código de empresa específico for fornecido, adiciona ao filtro.
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  const data = await apiGet('/INTEGRACAO/VENDA', params);
  return data.resultados || [];
}

// Busca um resumo das vendas de hoje. É uma chamada mais otimizada que a `fetchVendasHoje`.
export async function fetchVendaResumo(empresaCodigos) {
  const params = {
    dataInicial: todayISO(),
    dataFinal: todayISO(),
    situacao: 'A',
  };
  // Se uma lista de códigos de empresa for fornecida, junta-os com vírgula para o filtro.
  if (empresaCodigos?.length) {
    params.empresaCodigo = empresaCodigos.join(',');
  }

  return apiGet('/INTEGRACAO/VENDA_RESUMO', params);
}

// Busca os dados dos tanques de combustível.
export async function fetchTanques(empresaCodigo) {
  const params = { limite: 2000 };
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  const data = await apiGet('/INTEGRACAO/TANQUE', params);
  return data.resultados || [];
}

// Busca a posição de estoque dos produtos para uma empresa específica.
export async function fetchEstoque(empresaCodigo) {
  const data = await apiGet('/INTEGRACAO/PRODUTO_ESTOQUE', {
    empresaCodigo,
    limite: 2000,
  });
  return data.resultados || [];
}

// Busca os dados de desempenho dos funcionários (frentistas) para o dia de hoje.
export async function fetchMapaDesempenho(empresaCodigo) {
  const params = {
    dataInicial: todayISO(),
    dataFinal: todayISO(),
  };
  if (empresaCodigo) params.empresaCodigo = empresaCodigo;

  return apiGet('/INTEGRACAO/MAPA_DESEMPENHO', params);
}

// Busca os dados do DRE (Demonstrativo de Resultado do Exercício) do mês atual.
export async function fetchDRE(filiais) {
  const params = {
    dataInicial: firstDayOfMonthISO(), // Do primeiro dia do mês...
    dataFinal: todayISO(),             // ...até hoje.
  };
  // Se uma lista de filiais for fornecida, junta-as com vírgula para o filtro.
  if (filiais?.length) {
    params.filiais = filiais.join(',');
  }

  return apiGet('/INTEGRACAO/DRE', params);
}
