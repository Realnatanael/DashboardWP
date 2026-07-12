// Importa as funções que buscam dados da API do WebPosto.
// Cada função é responsável por buscar um tipo de dado específico.
import {
  fetchEmpresas, // Busca a lista de postos/empresas.
  fetchVendasHoje, // Busca as vendas do dia.
  fetchTanques, // Busca os dados dos tanques de combustível.
  fetchEstoque, // Busca a posição de estoque dos produtos.
  fetchMapaDesempenho, // Busca os dados de desempenho dos funcionários.
  fetchDRE, // Busca o Demonstrativo de Resultado do Exercício (dados financeiros).
} from '../services/postoApi.js';
// Importa a função que processa e organiza todos os dados brutos em um formato para o dashboard.
import { buildDashboardPayload } from '../services/dataAggregator.js';
// Importa o "molde" (Model) para interagir com a coleção de 'snapshots' no banco de dados.
// Um snapshot é uma "foto" dos dados em um determinado momento.
import { Snapshot } from '../models/Snapshot.js';

// --- Variáveis de Controle (Estado em Memória) ---

// Guarda o último conjunto de dados completo do dashboard que foi gerado.
// Fica na memória para ser enviado rapidamente para novos usuários que se conectam.
let lastDashboard = null;
// Guarda o último resultado bruto da busca de DRE. Como é uma busca "cara",
// a gente guarda para não precisar buscar toda hora.
let lastRawDre = null;
// Uma "trava" para evitar que duas sincronizações rodem ao mesmo tempo.
// Se `true`, significa que uma sincronização já está em andamento.
let isSyncing = false;
// Guarda o "timestamp" (o momento exato) da última vez que o DRE foi sincronizado.
// Usado para decidir se já está na hora de buscar o DRE novamente.
let lastDreSync = 0;

// --- Funções Auxiliares de Busca ---

/**
 * Busca o estoque de todas as empresas, uma por uma.
 * Se a busca para uma empresa falhar, ele apenas avisa no console e continua para a próxima.
 * @param {Array} empresas - A lista de objetos de empresa.
 * @returns {Promise<Array>} Uma lista com todos os itens de estoque de todas as empresas.
 */
async function fetchAllEstoque(empresas) {
  const results = []; // Começa com uma lista vazia.
  // Loop "for...of" para passar por cada empresa na lista de empresas.
  for (const empresa of empresas) {
    try {
      // Tenta buscar o estoque para o código da empresa atual.
      const estoque = await fetchEstoque(empresa.empresaCodigo);
      // Se der certo, adiciona os resultados na lista 'results'.
      results.push(...estoque);
    } catch (err) {
      // Se der erro, exibe um aviso no console com a mensagem de erro, mas não para o programa.
      console.warn(`Estoque empresa ${empresa.empresaCodigo}:`, err.message);
    }
  }
  return results; // Retorna a lista completa com os estoques que conseguiu buscar.
}

/**
 * Busca o mapa de desempenho de todas as empresas, uma por uma.
 * Também lida com erros individuais sem parar o processo todo.
 * @param {Array} empresas - A lista de objetos de empresa.
 * @returns {Promise<Array>} Uma lista com todos os dados de desempenho de todas as empresas.
 */
async function fetchAllMapa(empresas) {
  const results = [];
  for (const empresa of empresas) {
    try {
      const mapa = await fetchMapaDesempenho(empresa.empresaCodigo);
      if (Array.isArray(mapa)) results.push(...mapa);
    } catch (err) {
      console.warn(`Mapa empresa ${empresa.empresaCodigo}:`, err.message);
    }
  }
  return results;
}

// --- Função Principal de Sincronização ---

/**
 * A função principal que orquestra a busca e o processamento de todos os dados.
 * @param {boolean} includeDre - Se `true`, força a busca dos dados do DRE, que são mais pesados.
 * @returns {Promise<Object|null>} O objeto de dados do dashboard completo e processado.
 */
export async function runSync(includeDre = false) {
  // Se uma sincronização já estiver rodando, não faz nada e retorna os últimos dados que temos.
  if (isSyncing) return lastDashboard;
  // "Trava" a sincronização para evitar que outra comece.
  isSyncing = true;

  try {
    // Registra no console que a sincronização começou.
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Sincronizando dados...`);

    // 1. Busca a lista de todas as empresas (postos).
    const empresas = await fetchEmpresas();
    // Extrai apenas os códigos das empresas para usar em outras buscas.
    const empresaCodigos = empresas.map((e) => e.empresaCodigo);

    // 2. Busca vários dados em paralelo para ganhar tempo.
    // `Promise.all` dispara todas as buscas ao mesmo tempo e espera todas terminarem.
    const [vendas, tanques, estoque, mapa] = await Promise.all([
      fetchVendasHoje(), // Busca vendas do dia.
      fetchTanques(), // Busca dados dos tanques.
      fetchAllEstoque(empresas), // Busca estoque de todas as empresas.
      fetchAllMapa(empresas), // Busca desempenho dos funcionários de todas as empresas.
    ]);

    // 3. Lógica para buscar o DRE (dados financeiros).
    // O DRE é mais "pesado" e não muda tão rápido, então não buscamos toda vez.
    let dre = lastRawDre; // Começa com o último DRE que temos guardado.
    const now = Date.now();
    // Pega o intervalo de atualização do DRE das configurações (padrão: 5 minutos).
    const dreInterval = (parseInt(process.env.DRE_SYNC_INTERVAL_MINUTES || '5', 10)) * 60 * 1000;

    // Condições para buscar o DRE:
    // - Se `includeDre` for `true` (foi pedido para forçar a busca).
    // - Se não tivermos nenhum DRE guardado (`!dre`).
    // - Se já passou tempo suficiente desde a última busca (`now - lastDreSync > dreInterval`).
    if (includeDre || !dre || now - lastDreSync > dreInterval) {
      try {
        console.log('Sincronizando DRE...');
        dre = await fetchDRE(empresaCodigos);
        lastRawDre = dre; // Guarda o novo DRE bruto.
        lastDreSync = now; // Atualiza o tempo da última sincronização do DRE.
      } catch (err) {
        // Se a busca do DRE falhar, apenas avisa e continua com o DRE antigo (se houver).
        console.warn('DRE:', err.message);
      }
    }

    // 4. Processa e agrega todos os dados brutos em um único objeto para o dashboard.
    const payload = buildDashboardPayload({
      empresas,
      vendas,
      tanques,
      estoque,
      mapa,
      dre,
    });

    // 5. Atualiza a variável global com os novos dados.
    lastDashboard = payload;

    // 6. Salva uma "foto" (snapshot) dos dados no banco de dados para o histórico.
    await Snapshot.create({ tipo: 'dashboard', dados: payload });

    // 7. Limpa snapshots antigos do banco de dados (mais velhos que 7 dias).
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await Snapshot.deleteMany({ tipo: 'dashboard', geradoEm: { $lt: cutoff } });

    // Registra no console que a sincronização foi um sucesso, com alguns dados chave.
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Sync OK — ${payload.vendas.totalVendas} vendas, R$ ${payload.vendas.totalValor.toFixed(2)}`);

    // Retorna os dados processados.
    return payload;
  } catch (err) {
    // Se qualquer erro grave acontecer durante o `try`, ele é capturado aqui.
    console.error('Erro na sincronização:', err.message);
    // Lança o erro novamente para que quem chamou a função saiba que algo deu errado.
    throw err;
  } finally {
    // O bloco `finally` sempre executa, não importa se deu certo ou deu erro.
    // "Destrava" a sincronização para que uma nova possa começar.
    isSyncing = false;
  }
}

/**
 * Retorna o último conjunto de dados do dashboard que está em memória.
 * É uma função simples para acessar a variável `lastDashboard`.
 */
export function getLastDashboard() {
  return lastDashboard;
}

/**
 * Carrega o último snapshot salvo no banco de dados para a memória.
 * Isso é útil para que o servidor, ao reiniciar, já tenha dados para mostrar
 * imediatamente, sem precisar esperar a primeira sincronização completa.
 */
export async function loadLastSnapshot() {
  // Busca no banco de dados o último documento do tipo 'dashboard', ordenado pela data de geração.
  const snap = await Snapshot.findOne({ tipo: 'dashboard' }).sort({ geradoEm: -1 });
  if (snap) {
    // Se encontrou um snapshot, atualiza a variável em memória com os dados dele.
    lastDashboard = snap.dados;
    console.log('Último snapshot carregado do banco de dados.');
  }
  return lastDashboard;
}
