import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '../hooks/useDashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function SalesPanel({ vendas }) {
  if (!vendas) return null;

  const chartData = vendas.porPosto?.slice(0, 8).map((p) => ({
    nome: p.sigla || p.nome?.slice(0, 12) || `P${p.empresaCodigo}`,
    valor: p.valor,
    quantidade: p.quantidade,
  })) || [];

  return (
    <section className="panel panel--sales">
      <div className="panel__header">
        <h2>Vendas do Dia</h2>
        <span className="panel__badge live">AO VIVO</span>
      </div>

      <div className="kpi-grid kpi-grid--4">
        <div className="kpi-inline">
          <span className="kpi-inline__label">Faturamento</span>
          <span className="kpi-inline__value kpi-inline__value--lg">{formatCurrency(vendas.totalValor)}</span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Vendas</span>
          <span className="kpi-inline__value">{formatNumber(vendas.totalVendas)}</span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Ticket Médio</span>
          <span className="kpi-inline__value">{formatCurrency(vendas.ticketMedio)}</span>
        </div>
        <div className="kpi-inline">
          <span className="kpi-inline__label">Canceladas</span>
          <span className="kpi-inline__value kpi-inline__value--warn">{formatNumber(vendas.canceladas)}</span>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Faturamento por Posto</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={12} />
            <YAxis type="category" dataKey="nome" width={80} stroke="#64748b" fontSize={12} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Faturamento']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
