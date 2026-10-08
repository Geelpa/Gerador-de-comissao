function calcularComissaoTotal({
    dadosVendas,
    dadosUpgrades,
    metaAtivacoes,
    perfilComissao = 'vendedor',
    metaAtingidaFuncionario = 0
}) {
    const totalAtivacoes = dadosVendas.totalAtivacoes;
    const totalValorVendas = dadosVendas.totalValor;
    const totalUpgradesPositivos = dadosUpgrades.totalDiferenca;
    const funcionario = perfilComissao === 'funcionario';

    const quantidadeMetaAtingida = funcionario ? metaAtingidaFuncionario : totalAtivacoes;
    const percentualAlcance = metaAtivacoes > 0 ? (quantidadeMetaAtingida / metaAtivacoes) * 100 : 0;
    let porcentagemEfetiva = null;
    let valorPorVenda = null;

    if (funcionario) {
        valorPorVenda = percentualAlcance > 80 ? 12 : percentualAlcance > 60 ? 10 : 7;
    } else if (percentualAlcance >= 100) {
        porcentagemEfetiva = 7;
    } else if (percentualAlcance >= 80) {
        porcentagemEfetiva = 5;
    } else {
        porcentagemEfetiva = 3;
    }

    const vendasComissionaveis = funcionario
        ? (Array.isArray(dadosVendas.lista) && dadosVendas.lista.length
            ? dadosVendas.lista.length
            : totalAtivacoes)
        : totalAtivacoes;
    const comissaoVendas = funcionario
        ? vendasComissionaveis * valorPorVenda
        : totalValorVendas * (porcentagemEfetiva / 100);
    const comissaoTotal = comissaoVendas + totalUpgradesPositivos;

    const vendedorIdentificado = dadosVendas.vendedor || dadosUpgrades.vendedor || 'Vendedor Não Identificado';

    return {
        vendedor: vendedorIdentificado,
        resumo: {
            totalAtivacoes,
            totalValorVendas,
            totalUpgrades: totalUpgradesPositivos,
            comissaoVendas,
            comissaoTotal,
            metaAtivacoes,
            metaAtingidaFuncionario: funcionario ? metaAtingidaFuncionario : null,
            percentualAlcance: percentualAlcance.toFixed(1),
            porcentagemUtilizada: porcentagemEfetiva,
            valorPorVenda,
            vendasComissionaveis
        },
        perfilComissao,
        vendas: dadosVendas.lista,
        upgrades: dadosUpgrades.lista
    };
}