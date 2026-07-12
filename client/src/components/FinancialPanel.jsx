import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { formatCurrency, formatPercent } from '../hooks/useDashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function FinancialPanel({ financeiro }) {
  if (!financeiro) return null;

  const margemData = [
    { name: 'Receita Líquida', value: financeiro.receitaLiquida },
    { name: 'Despesas', value: financeiro.totalDespesas },
    { name: 'Lucro', value: Math.max(0, financeiro.lucroOperacional) },
  ];

  const grupoData = financeiro.vendasPorGrupo?.slice(0, 6).map((g) => ({
    grupo: g.grupo?.slice(0, 15) || 'Outros',
    margem: g.margem,
    valor: g.valorVenda,
  })) || [];

  return (
    <section className="panel panel--financial">
      <div className="panel__header">
        <h2>Resultado Financeiro</h2>
        <span className="panel__period">
          {financeiro.periodo?.inicio} → {financeiro.periodo?.fim}
        </span>
      </div>

      <div className="kpi-grid kpi-grid--4">
        <div className="kpi-inline kpi-inline--highlight">
          <span className="kpi-inline__label">Lucro Operacional</span>
          <span className={`kpi-inline__value kpi-inline__value--lg ${financeiro.lucroOperacional >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(financeiro.lucroOperacional)}
          </span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Receita Bruta</span>
          <span className="kpi-inline__value">{formatCurrency(financeiro.receitaBruta)}</span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Receita Líquida</span>
          <span className="kpi-inline__value">{formatCurrency(financeiro.receitaLiquida)}</span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Margem</span>
          <span className="kpi-inline__value">{formatPercent(financeiro.margemPercentual)}</span>
        </div>
      </div>

      <div className="financial-charts">
        <div className="chart-container chart-container--half">
          <h3 className="chart-title">Composição do Resultado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={margemData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {margemData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {margemData.map((d, i) => (
              <span key={d.name} className="pie-legend__item">
                <span className="pie-legend__dot" style={{ background: COLORS[i] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        <div className="chart-container chart-container--half">
          <h3 className="chart-title">Margem por Grupo de Produto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grupoData}>
              <XAxis dataKey="grupo" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={11} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="margem" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {financeiro.despesasResumo?.length > 0 && (
        <div className="despesas-list">
          <h3 className="chart-title">Principais Despesas</h3>
          {financeiro.despesasResumo.map((d, i) => (
            <div key={i} className="despesa-item">
              <span className="despesa-item__cat">{d.categoria}</span>
              <span className="despesa-item__val">{formatCurrency(d.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
