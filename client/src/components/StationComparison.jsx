import { formatCurrency, formatNumber } from '../hooks/useDashboard';

export default function StationComparison({ vendas, desempenho }) {
  if (!vendas?.porPosto?.length) return null;

  const maxValor = vendas.porPosto[0]?.valor || 1;

  return (
    <section className="panel panel--comparison">
      <div className="panel__header">
        <h2>Comparativo de Postos</h2>
      </div>

      <div className="ranking-list">
        {vendas.porPosto.map((posto, index) => {
          const pct = (posto.valor / maxValor) * 100;
          const topFrentista = desempenho?.find((d) => d.empresaCodigo === posto.empresaCodigo);

          return (
            <div key={posto.empresaCodigo} className="ranking-item">
              <div className="ranking-item__position">{index + 1}</div>
              <div className="ranking-item__content">
                <div className="ranking-item__header">
                  <span className="ranking-item__name">{posto.nome}</span>
                  <span className="ranking-item__value">{formatCurrency(posto.valor)}</span>
                </div>
                <div className="ranking-item__bar">
                  <div className="ranking-item__fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="ranking-item__meta">
                  <span>{formatNumber(posto.quantidade)} vendas</span>
                  {topFrentista && (
                    <span>Top: {topFrentista.funcionarioNome} — {formatCurrency(topFrentista.valorVenda)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
