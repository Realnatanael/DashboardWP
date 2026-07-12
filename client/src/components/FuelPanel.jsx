import { formatLiters, formatPercent } from '../hooks/useDashboard';

export default function FuelPanel({ tanques, estoque }) {
  if (!tanques?.length) return null;

  const alertas = tanques.filter((t) => t.alerta);

  return (
    <section className="panel panel--fuel">
      <div className="panel__header">
        <h2>Combustíveis</h2>
        {alertas.length > 0 && (
          <span className="panel__badge alert">{alertas.length} ALERTA{alertas.length > 1 ? 'S' : ''}</span>
        )}
      </div>

      <div className="tank-grid">
        {tanques.map((tanque) => (
          <div key={`${tanque.empresaCodigo}-${tanque.tanqueCodigo}`} className={`tank-card ${tanque.alerta ? 'tank-card--alert' : ''}`}>
            <div className="tank-card__header">
              <span className="tank-card__name">{tanque.nome}</span>
              <span className="tank-card__posto">{tanque.postoNome}</span>
            </div>
            <div className="tank-card__gauge">
              <div className="tank-gauge">
                <div
                  className="tank-gauge__fill"
                  style={{
                    height: `${tanque.percentual}%`,
                    background: tanque.percentual < 20 ? '#ef4444' : tanque.percentual < 40 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
              <span className="tank-gauge__percent">{formatPercent(tanque.percentual)}</span>
            </div>
            <div className="tank-card__stats">
              <span>{formatLiters(tanque.estoqueLitros)}</span>
              <span className="tank-card__cap">/ {formatLiters(tanque.capacidade)}</span>
            </div>
          </div>
        ))}
      </div>

      {estoque?.length > 0 && (
        <div className="estoque-section">
          <h3 className="chart-title">Saldo de Estoque (menores níveis)</h3>
          <div className="estoque-list">
            {estoque.slice(0, 6).map((item, i) => (
              <div key={i} className="estoque-item">
                <div className="estoque-item__info">
                  <span className="estoque-item__nome">{item.estoqueNome}</span>
                  <span className="estoque-item__posto">{item.postoNome}</span>
                </div>
                <span className={`estoque-item__qty ${item.quantidade < 1000 ? 'low' : ''}`}>
                  {formatLiters(item.quantidade)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
