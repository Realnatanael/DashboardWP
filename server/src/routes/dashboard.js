import { Router } from 'express';
import { getLastDashboard, runSync } from '../jobs/syncJob.js';
import { Snapshot } from '../models/Snapshot.js';

const router = Router();

router.get('/', (_req, res) => {
  const data = getLastDashboard();
  if (!data) {
    return res.status(503).json({ erro: 'Dados ainda não disponíveis. Aguarde a primeira sincronização.' });
  }
  res.json(data);
});

router.post('/sync', async (_req, res) => {
  try {
    const data = await runSync(true);
    res.json({ ok: true, geradoEm: data.geradoEm });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/historico', async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite || '24', 10), 100);
  const snaps = await Snapshot.find({ tipo: 'dashboard' })
    .sort({ geradoEm: -1 })
    .limit(limite)
    .select('geradoEm dados.vendas.totalValor dados.vendas.totalVendas dados.financeiro.lucroOperacional');

  res.json(snaps.map((s) => ({
    geradoEm: s.geradoEm,
    totalValor: s.dados?.vendas?.totalValor || 0,
    totalVendas: s.dados?.vendas?.totalVendas || 0,
    lucro: s.dados?.financeiro?.lucroOperacional || 0,
  })));
});

router.get('/health', (_req, res) => {
  const data = getLastDashboard();
  res.json({
    status: 'ok',
    temDados: !!data,
    ultimaAtualizacao: data?.geradoEm || null,
  });
});

export default router;
