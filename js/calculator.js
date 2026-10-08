function calcularComissaoTotal({ dadosVendas, dadosUpgrades, metaAtivacoes }) {
    const totalAtivacoes = dadosVendas.totalAtivacoes;
    const totalValorVendas = dadosVendas.totalValor;
    const totalUpgradesPositivos = dadosUpgrades.totalDiferenca;

    // Cálculo da porcentagem de alcance da meta
    const percentualAlcance = metaAtivacoes > 0 ? (totalAtivacoes / metaAtivacoes) * 100 : 0;
    
    // Regra dos 3 níveis de comissão
    let porcentagemEfetiva = 3;
    if (percentualAlcance >= 100) {
        porcentagemEfetiva = 7;
    } else if (percentualAlcance >= 80) {
        porcentagemEfetiva = 5;
    } else {
        porcentagemEfetiva = 3;
    }

    const comissaoVendas = totalValorVendas * (porcentagemEfetiva / 100);
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
            percentualAlcance: percentualAlcance.toFixed(1),
            porcentagemUtilizada: porcentagemEfetiva
        },
        vendas: dadosVendas.lista,
        upgrades: dadosUpgrades.lista
    };
}