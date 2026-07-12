function sumBy(items, key) {
  return items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function aggregateVendas(vendas, empresasMap) {
  const porPosto = {};
  let totalVendas = 0;
  let totalValor = 0;
  let canceladas = 0;

  for (const venda of vendas) {
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

    if (venda.cancelada === 'S') {
      canceladas++;
      continue;
    }

    porPosto[codigo].quantidade++;
    porPosto[codigo].valor += venda.totalVenda || 0;
    totalVendas++;
    totalValor += venda.totalVenda || 0;
  }

  const ranking = Object.values(porPosto).sort((a, b) => b.valor - a.valor);

  return {
    totalVendas,
    totalValor,
    canceladas,
    ticketMedio: totalVendas > 0 ? totalValor / totalVendas : 0,
    porPosto: ranking,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

export function aggregateTanques(tanques, empresasMap) {
  return tanques.map((tanque) => {
    const nivel = tanque.estoqueEscritural || 0;
    const capacidade = tanque.capacidade || 1;
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
      alerta: percentual < 20,
    };
  });
}

export function aggregateEstoque(estoqueItems, empresasMap) {
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

  return result.sort((a, b) => a.quantidade - b.quantidade);
}

export function aggregateMapaDesempenho(mapa, empresasMap) {
  const porFuncionario = {};

  for (const item of mapa) {
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

  return Object.values(porFuncionario)
    .sort((a, b) => b.valorVenda - a.valorVenda)
    .slice(0, 20);
}

export function aggregateDRE(dre) {
  if (!dre) return null;

  const totalReceitas = sumBy(dre.apuracaoReceita || [], 'valor');
  const totalDespesas = sumBy(dre.apuracaoPagamentos || [], 'valor');
  const receitaLiquida = (dre.receitaBruta || 0) - (dre.deducaoFiscal || 0);
  const lucroOperacional = receitaLiquida + totalReceitas - totalDespesas;

  const vendasPorGrupo = (dre.vendasGrupo || []).map((g) => ({
    grupo: g.produtoGrupo,
    valorVenda: g.valorVenda || 0,
    cmv: g.cmv || 0,
    margem: (g.valorVenda || 0) - (g.cmv || 0),
    margemPercentual: g.valorVenda ? (((g.valorVenda - (g.cmv || 0)) / g.valorVenda) * 100) : 0,
  }));

  const despesasPorCategoria = groupBy(dre.apuracaoPagamentos || [], 'planoContaGerencialPAI');
  const despesasResumo = Object.entries(despesasPorCategoria).map(([categoria, itens]) => ({
    categoria: categoria || 'Outros',
    valor: sumBy(itens, 'valor'),
  })).sort((a, b) => b.valor - a.valor);

  return {
    receitaBruta: dre.receitaBruta || 0,
    deducaoFiscal: dre.deducaoFiscal || 0,
    receitaLiquida,
    totalReceitas,
    totalDespesas,
    lucroOperacional,
    margemPercentual: receitaLiquida ? (lucroOperacional / receitaLiquida) * 100 : 0,
    vendasPorGrupo,
    despesasResumo: despesasResumo.slice(0, 10),
    periodo: {
      inicio: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
      fim: new Date().toISOString().split('T')[0],
    },
    ultimaAtualizacao: new Date().toISOString(),
  };
}

export function buildDashboardPayload({
  empresas,
  vendas,
  tanques,
  estoque,
  mapa,
  dre,
}) {
  const empresasMap = Object.fromEntries(
    empresas.map((e) => [e.empresaCodigo, e])
  );

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
