// Esta é uma função "ajudante" genérica.
// Pense nela como uma calculadora que soma valores específicos de uma lista.
// items: A lista de coisas que queremos somar (ex: uma lista de vendas).
// key: O nome do campo que contém o valor a ser somado (ex: 'totalVenda').
function sumBy(items, key) {
  // 'reduce' é como percorrer a lista com uma calculadora na mão.
  // 'acc' é o acumulador (o total até agora), e 'item' é o item atual da lista.
  // Para cada item, pegamos o valor do campo 'key', garantimos que é um número, e somamos ao acumulador.
  return items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
}

// Outra função "ajudante" genérica.
// Ela organiza uma lista de itens em grupos, com base em uma chave.
// É como pegar uma caixa de lápis de cor e separá-los por cor em montinhos.
// items: A lista de coisas para agrupar (ex: uma lista de despesas).
// key: O campo que define a qual grupo o item pertence (ex: 'categoriaDaDespesa').
function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const groupKey = item[key]; // Pega o valor da chave de agrupamento (ex: 'Alimentação').
    if (!acc[groupKey]) acc[groupKey] = []; // Se o "montinho" para essa cor ainda não existe, cria um.
    acc[groupKey].push(item); // Adiciona o item (o lápis) ao seu "montinho" (grupo) correspondente.
    return acc;
  }, {});
}

// Esta função processa os dados brutos de vendas para criar um resumo.
// vendas: A lista de todas as vendas que vieram da API.
// empresasMap: Um "mapa" para encontrar rapidamente os detalhes de uma empresa pelo seu código.
export function aggregateVendas(vendas, empresasMap) {
  const porPosto = {};
  let totalVendas = 0;
  let totalValor = 0;
  let canceladas = 0;

  for (const venda of vendas) {
    // Para cada venda na lista...
    const codigo = venda.empresaCodigo;
    if (!porPosto[codigo]) {
      porPosto[codigo] = {
        empresaCodigo: codigo,
        nome: empresasMap[codigo]?.fantasia || empresasMap[codigo]?.sigla || `Posto ${codigo}`,
        sigla: empresasMap[codigo]?.sigla || '',
        quantidade: 0,
        valor: 0,
      };
    }

    // Se a venda foi cancelada ('S' de "Sim"), contamos e pulamos para a próxima.
    if (venda.cancelada === 'S') {
      canceladas++;
      continue;
    }

    // Se não foi cancelada, atualizamos os totais do posto e os totais gerais.
    porPosto[codigo].quantidade++;
    porPosto[codigo].valor += venda.totalVenda || 0;
    totalVendas++;
    totalValor += venda.totalVenda || 0;
  }

  // Cria um ranking dos postos, ordenando do que mais vendeu para o que menos vendeu.
  const ranking = Object.values(porPosto).sort((a, b) => b.valor - a.valor);

  // Retorna um objeto com todos os dados de vendas já calculados e organizados.
  return {
    totalVendas,
    totalValor,
    canceladas,
    // Calcula o ticket médio (valor total / número de vendas).
    ticketMedio: totalVendas > 0 ? totalValor / totalVendas : 0,
    porPosto: ranking,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// Processa os dados dos tanques de combustível.
export function aggregateTanques(tanques, empresasMap) {
  // 'map' transforma cada item da lista de tanques em um novo formato mais útil.
  return tanques.map((tanque) => {
    const nivel = tanque.estoqueEscritural || 0;
    const capacidade = tanque.capacidade || 1;
    // Calcula o percentual de ocupação do tanque.
    const percentual = Math.min(100, Math.round((nivel / capacidade) * 100));

    return {
      empresaCodigo: tanque.empresaCodigo,
      postoNome: empresasMap[tanque.empresaCodigo]?.fantasia || empresasMap[tanque.empresaCodigo]?.sigla || `Posto ${tanque.empresaCodigo}`,
      tanqueCodigo: tanque.tanqueCodigo,
      nome: tanque.nome,
      produtoCodigo: tanque.produtoCodigo,
      capacidade,
      estoqueLitros: nivel,
      percentual,
      dataHoraMedidor: tanque.dataHoraMedidor,
      // Define um alerta se o tanque estiver com menos de 20% da capacidade.
      alerta: percentual < 20,
    };
  });
}

// Processa os dados de estoque dos produtos.
export function aggregateEstoque(estoqueItems, empresasMap) {
  // O objetivo é criar uma lista "plana" de estoque, já que um produto pode
  // estar em vários locais de estoque diferentes dentro do mesmo posto.
  const result = [];

  for (const item of estoqueItems) {
    const saldos = item.saldoEstoque || [];
    for (const saldo of saldos) {
      result.push({
        empresaCodigo: item.empresaCodigo,
        postoNome: empresasMap[item.empresaCodigo]?.fantasia || `Posto ${item.empresaCodigo}`,
        produtoCodigo: item.produtoCodigo,
        estoqueNome: saldo.estoqueNome,
        quantidade: saldo.quantidade,
        saldoTotal: item.saldo,
      });
    }
  }

  // Retorna a lista de itens de estoque, ordenada pela quantidade (do menor para o maior).
  return result.sort((a, b) => a.quantidade - b.quantidade);
}

// Processa o "mapa de desempenho" para resumir a performance dos funcionários.
export function aggregateMapaDesempenho(mapa, empresasMap) {
  // Cria um objeto para agrupar os dados por funcionário.
  const porFuncionario = {};

  for (const item of mapa) {
    // A chave única para cada funcionário é a combinação do código da empresa e do funcionário.
    const key = `${item.empresaCodigo}-${item.funcionarioCodigo}`;
    if (!porFuncionario[key]) {
      porFuncionario[key] = {
        empresaCodigo: item.empresaCodigo,
        postoNome: empresasMap[item.empresaCodigo]?.fantasia || `Posto ${item.empresaCodigo}`,
        funcionarioCodigo: item.funcionarioCodigo,
        funcionarioNome: item.funcionarioNome,
        quantidade: 0,
        valorVenda: 0,
        valorComissao: 0,
        produtos: [],
      };
    }

    // Soma os valores de quantidade, venda e comissão para o funcionário correspondente.
    porFuncionario[key].quantidade += item.quantidade || 0;
    porFuncionario[key].valorVenda += item.valorVenda || 0;
    porFuncionario[key].valorComissao += item.valorComissao || 0;
    porFuncionario[key].produtos.push({
      produtoNome: item.produtoNome,
      grupoNome: item.grupoNome,
      quantidade: item.quantidade,
      valorVenda: item.valorVenda,
    });
  }

  // Retorna uma lista com os 20 funcionários que mais venderam em valor.
  return Object.values(porFuncionario)
    .sort((a, b) => b.valorVenda - a.valorVenda)
    .slice(0, 20);
}

// Processa os dados do DRE (Demonstrativo de Resultado do Exercício).
// O DRE é um relatório financeiro que mostra se a empresa teve lucro ou prejuízo.
export function aggregateDRE(dre) {
  if (!dre) return null;

  // Soma todas as receitas e despesas.
  const totalReceitas = sumBy(dre.apuracaoReceita || [], 'valor');
  const totalDespesas = sumBy(dre.apuracaoPagamentos || [], 'valor');
  // Calcula a receita líquida (receita bruta - impostos sobre a venda).
  const receitaLiquida = (dre.receitaBruta || 0) - (dre.deducaoFiscal || 0);
  // Calcula o lucro operacional (o que sobrou depois de pagar tudo).
  const lucroOperacional = receitaLiquida + totalReceitas - totalDespesas;

  // Calcula a margem de lucro para cada grupo de produto.
  const vendasPorGrupo = (dre.vendasGrupo || []).map((g) => ({
    grupo: g.produtoGrupo,
    valorVenda: g.valorVenda || 0,
    cmv: g.cmv || 0,
    margem: (g.valorVenda || 0) - (g.cmv || 0),
    // Margem em percentual: (lucro / receita) * 100
    margemPercentual: g.valorVenda ? (((g.valorVenda - (g.cmv || 0)) / g.valorVenda) * 100) : 0,
  }));

  // Agrupa as despesas por categoria principal (ex: 'Despesas Administrativas').
  const despesasPorCategoria = groupBy(dre.apuracaoPagamentos || [], 'planoContaGerencialPAI');
  const despesasResumo = Object.entries(despesasPorCategoria).map(([categoria, itens]) => ({
    categoria: categoria || 'Outros',
    valor: sumBy(itens, 'valor'),
  })).sort((a, b) => b.valor - a.valor);

  // Retorna um objeto com o resumo financeiro do período.
  return {
    receitaBruta: dre.receitaBruta || 0,
    deducaoFiscal: dre.deducaoFiscal || 0,
    receitaLiquida,
    totalReceitas,
    totalDespesas,
    lucroOperacional,
    // Margem de lucro geral em percentual.
    margemPercentual: receitaLiquida ? (lucroOperacional / receitaLiquida) * 100 : 0,
    vendasPorGrupo,
    // Pega apenas as 10 maiores categorias de despesa para exibir no painel.
    despesasResumo: despesasResumo.slice(0, 10),
    periodo: {
      inicio: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
      fim: new Date().toISOString().split('T')[0],
    },
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// Esta é a função principal que junta tudo.
// Ela recebe os dados brutos de várias fontes e os organiza em um único "pacote" de dados para o dashboard.
export function buildDashboardPayload({
  empresas,
  vendas,
  tanques,
  estoque,
  mapa,
  dre,
}) {
  // Cria um "mapa" de empresas para facilitar a busca de dados de uma empresa pelo seu código.
  // É como criar um índice em um livro para encontrar um capítulo rapidamente.
  const empresasMap = Object.fromEntries(
    empresas.map((e) => [e.empresaCodigo, e])
  );

  // Retorna o objeto final com todos os dados agregados e prontos para serem enviados para o frontend (a tela do dashboard).
  return {
    empresas: empresas.map((e) => ({
      codigo: e.empresaCodigo,
      nome: e.fantasia,
      sigla: e.sigla,
      cidade: e.cidade,
      estado: e.estado,
    })),
    vendas: aggregateVendas(vendas, empresasMap),
    tanques: aggregateTanques(tanques, empresasMap),
    estoque: aggregateEstoque(estoque, empresasMap),
    desempenho: aggregateMapaDesempenho(mapa, empresasMap),
    financeiro: aggregateDRE(dre),
    geradoEm: new Date().toISOString(),
  };
}
