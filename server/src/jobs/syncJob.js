import {
  fetchEmpresas,
  fetchVendasHoje,
  fetchTanques,
  fetchEstoque,
  fetchMapaDesempenho,
  fetchDRE,
} from '../services/postoApi.js';
import { buildDashboardPayload } from '../services/dataAggregator.js';
import { Snapshot } from '../models/Snapshot.js';

let lastDashboard = null;
let lastRawDre = null;
let isSyncing = false;
let lastDreSync = 0;

async function fetchAllEstoque(empresas) {
  const results = [];
  for (const empresa of empresas) {
    try {
      const estoque = await fetchEstoque(empresa.empresaCodigo);
      results.push(...estoque);
    } catch (err) {
      console.warn(`Estoque empresa ${empresa.empresaCodigo}:`, err.message);
    }
  }
  return results;
}

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

export async function runSync(includeDre = false) {
  if (isSyncing) return lastDashboard;
  isSyncing = true;

  try {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Sincronizando dados...`);

    const empresas = await fetchEmpresas();
    const empresaCodigos = empresas.map((e) => e.empresaCodigo);

    const [vendas, tanques, estoque, mapa] = await Promise.all([
      fetchVendasHoje(),
      fetchTanques(),
      fetchAllEstoque(empresas),
      fetchAllMapa(empresas),
    ]);

    let dre = lastRawDre;
    const now = Date.now();
    const dreInterval = (parseInt(process.env.DRE_SYNC_INTERVAL_MINUTES || '5', 10)) * 60 * 1000;

    if (includeDre || !dre || now - lastDreSync > dreInterval) {
      try {
        dre = await fetchDRE(empresaCodigos);
        lastRawDre = dre;
        lastDreSync = now;
      } catch (err) {
        console.warn('DRE:', err.message);
      }
    }

    const payload = buildDashboardPayload({
      empresas,
      vendas,
      tanques,
      estoque,
      mapa,
      dre,
    });

    lastDashboard = payload;

    await Snapshot.create({ tipo: 'dashboard', dados: payload });

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await Snapshot.deleteMany({ tipo: 'dashboard', geradoEm: { $lt: cutoff } });

    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Sync OK — ${payload.vendas.totalVendas} vendas, R$ ${payload.vendas.totalValor.toFixed(2)}`);

    return payload;
  } catch (err) {
    console.error('Erro na sincronização:', err.message);
    throw err;
  } finally {
    isSyncing = false;
  }
}

export function getLastDashboard() {
  return lastDashboard;
}

export async function loadLastSnapshot() {
  const snap = await Snapshot.findOne({ tipo: 'dashboard' }).sort({ geradoEm: -1 });
  if (snap) {
    lastDashboard = snap.dados;
  }
  return lastDashboard;
}
