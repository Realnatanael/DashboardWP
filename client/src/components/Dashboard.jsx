// Importa os recursos necessários de outros arquivos do projeto.
// O useDashboard é um "hook" que busca e gerencia os dados do painel.
// O formatTime é uma função para formatar a hora de forma amigável.
import { useDashboard, formatTime, formatCurrency, formatNumber } from '../hooks/useDashboard';
// KpiCard é o componente para os cartões de indicadores (KPIs).
import KpiCard from './KpiCard';
// SalesPanel é o painel de vendas.
import SalesPanel from './SalesPanel';
// FuelPanel é o painel de combustíveis.
import FuelPanel from './FuelPanel';
// FinancialPanel é o painel financeiro.
import FinancialPanel from './FinancialPanel';
// StationComparison é o painel de comparação entre postos.
import StationComparison from './StationComparison';

// Define o componente principal do Dashboard.
// Um "componente" no React é como um bloco de construção da interface.
export default function Dashboard() {
  // Usa o hook useDashboard para obter os dados e o estado da aplicação.
  // data: contém todas as informações a serem exibidas (vendas, tanques, etc.).
  // loading: um valor booleano (true/false) que indica se os dados estão sendo carregados.
  // error: armazena uma mensagem de erro, se houver.
  // connected: indica se a conexão com o servidor está ativa.
  // lastUpdate: guarda a data e hora da última atualização dos dados.
  const { data, loading, error, connected, lastUpdate } = useDashboard();

  // Se os dados estiverem carregando E ainda não houver dados para mostrar,
  // exibe uma tela de carregamento.
  if (loading && !data) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  // A função return define o que o componente vai mostrar na tela (sua estrutura HTML).
  return (
    <div className="dashboard">
      {/* Cabeçalho do painel */}
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo">⛽</div>
          <div>
            <h1>Dashboard Executivo</h1>
            <p className="dashboard__subtitle">
              {/* Mostra o número de postos na rede. Se não houver dados, mostra 0. */}
              {data?.empresas?.length || 0} postos na rede{' '}
            </p>
          </div>
        </div>
        <div className="dashboard__status">
          {/* A bolinha de status fica verde se 'connected' for true, e vermelha se for false. */}
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          <span className="status-text">
            {connected ? 'Tempo Real' : 'Reconectando...'}
          </span>
          <span className="status-time">Atualizado às {formatTime(lastUpdate)}</span>
        </div>
      </header>

      {/* Se houver um erro E não houver dados, mostra uma faixa de erro. */}
      {error && !data && (
        <div className="error-banner">
          <span>⚠ {error}</span>
          <small>Verifique se o servidor está rodando e as credenciais da API estão configuradas.</small>
        </div>
      )}

      {/* Se os dados (data) existirem, mostra o conteúdo principal do dashboard. */}
      {data && (
        <>
          {/* Seção com a linha de cartões de indicadores (KPIs) */}
          <section className="kpi-row">
            {/* Cartão de Faturamento do Dia */}
            <KpiCard
              label="Faturamento Hoje"
              value={formatCurrency(data.vendas?.totalValor)} // Valor formatado como moeda
              sub={`${formatNumber(data.vendas?.totalVendas)} vendas`} // Subtítulo com o número de vendas
              variant="primary" // Estilo do cartão
              icon="💰"
            />
            {/* Cartão de Ticket Médio */}
            <KpiCard
              label="Ticket Médio"
              value={formatCurrency(data.vendas?.ticketMedio)}
              variant="default"
              icon="🧾"
            />
            {/* Cartão de Lucro do Mês */}
            <KpiCard
              label="Lucro do Mês"
              value={formatCurrency(data.financeiro?.lucroOperacional)}
              sub={`Margem ${(data.financeiro?.margemPercentual || 0).toFixed(1)}%`} // Subtítulo com a margem percentual
              // O estilo do cartão muda para 'success' (verde) se o lucro for positivo, e 'danger' (vermelho) se for negativo.
              variant={data.financeiro?.lucroOperacional >= 0 ? 'success' : 'danger'}
              icon="📈"
            />
            {/* Cartão de Tanques em Alerta */}
            <KpiCard
              label="Tanques em Alerta"
              // Conta quantos tanques têm a propriedade 'alerta' como true.
              value={formatNumber(data.tanques?.filter((t) => t.alerta).length)}
              sub={`de ${formatNumber(data.tanques?.length)} tanques`}
              // O estilo muda para 'danger' (vermelho) se algum tanque estiver em alerta.
              variant={data.tanques?.some((t) => t.alerta) ? 'danger' : 'success'}
              icon="🛢️"
            />
          </section>

          {/* Grid principal que organiza os painéis maiores */}
          <div className="dashboard__grid">
            {/* Renderiza o painel de vendas, passando os dados de vendas para ele. */}
            <SalesPanel vendas={data.vendas} />
            {/* Renderiza o painel de comparação de postos. */}
            <StationComparison vendas={data.vendas} desempenho={data.desempenho} />
            {/* Renderiza o painel de combustíveis. */}
            <FuelPanel tanques={data.tanques} estoque={data.estoque} />
            {/* Renderiza o painel financeiro. */}
            <FinancialPanel financeiro={data.financeiro} />
          </div>
        </>
      )}
    </div>
  );
}
