// Este arquivo define as rotas relacionadas ao dashboard da aplicação. Ele utiliza o Express para criar endpoints que permitem obter dados do dashboard, forçar sincronizações e acessar o histórico de snapshots.
// Importa o módulo `Router` do Express, que permite criar rotas de forma modular.
// Importa funções específicas do módulo `syncJob.js`, que cuidam da sincronização dos dados do dashboard e da obtenção do último snapshot disponível.
// Importa o modelo `Snapshot` do Mongoose, que representa os registros de snapshots armazenados no banco de dados MongoDB.
import { Router } from 'express';
import { getLastDashboard, runSync } from '../jobs/syncJob.js';
import { Snapshot } from '../models/Snapshot.js';
// Cria uma nova instância do roteador do Express. Todas as rotas relacionadas ao dashboard serão definidas neste objeto `router`.
const router = Router();
// Rota para obter os dados do dashboard. Retorna o último snapshot disponível.
router.get('/', (_req, res) => {
  const data = getLastDashboard();
  if (!data) {
    return res.status(503).json({ erro: 'Dados ainda não disponíveis. Aguarde a primeira sincronização.' });
  }
  res.json(data);
});
// Rota para forçar a sincronização dos dados do dashboard. o metodo POST é usado porque estamos "criando" uma nova sincronização.
router.post('/sync', async (_req, res) => {
  try {
    const data = await runSync(true);
    res.json({ ok: true, geradoEm: data.geradoEm });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});
// Rota para obter o histórico de snapshots do dashboard. Aceita um parâmetro de query `limite` para definir quantos registros retornar (máximo 100).
router.get('/historico', async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite || '24', 10), 100);
  const snaps = await Snapshot.find({ tipo: 'dashboard' })
    .sort({ geradoEm: -1 })
    .limit(limite)
    .select('geradoEm dados.vendas.totalValor dados.vendas.totalVendas dados.financeiro.lucroOperacional');
  // Retorna apenas os campos relevantes de cada snapshot, garantindo que a resposta seja leve e rápida. Cada snapshot é mapeado para um objeto contendo a data de geração e os valores agregados de vendas e lucro.
  res.json(snaps.map((s) => ({
    geradoEm: s.geradoEm,
    totalValor: s.dados?.vendas?.totalValor || 0,
    totalVendas: s.dados?.vendas?.totalVendas || 0,
    lucro: s.dados?.financeiro?.lucroOperacional || 0,
  })));
});
// Rota de saúde do servidor. Retorna status "ok" e se há dados disponíveis. 
router.get('/health', (_req, res) => {
  const data = getLastDashboard();
  res.json({
    status: 'ok',
    temDados: !!data,
    ultimaAtualizacao: data?.geradoEm || null,
  });
});
// Exporta o roteador para que ele possa ser usado em outros arquivos, como o arquivo principal do servidor (`index.js`).
export default router;
