function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarInterfaceResultados(dados, temVendas) {
    document.getElementById('comissaoPorcentagem').value = dados.resumo.porcentagemUtilizada;

    document.getElementById('resTotalAtivacoes').innerText = temVendas 
        ? `${dados.resumo.totalAtivacoes} / ${dados.resumo.metaAtivacoes} (${dados.resumo.percentualAlcance}%)` 
        : '0 (Sem Doc 01)';

    document.getElementById('resTotalVendas').innerText = formatarMoeda(dados.resumo.totalValorVendas);
    document.getElementById('resTotalUpgrades').innerText = formatarMoeda(dados.resumo.totalUpgrades);
    document.getElementById('resComissao').innerText = formatarMoeda(dados.resumo.comissaoTotal);

    document.getElementById('areaResultados').classList.remove('hidden');
}

function definirEstadoBotaoProcessar(carregando) {
    const btn = document.getElementById('btnProcessar');
    if (!btn) return;
    btn.innerText = carregando ? "⏳ Lendo e Processando..." : "Processar e Calcular Comissão";
    btn.disabled = carregando;
}

function definirEstadoBotaoDownload(carregando) {
    const btn = document.getElementById('btnDownload');
    if (!btn) return;
    btn.innerText = carregando ? "⏳ Gerando PDF..." : "Exportar Relatório";
    btn.disabled = carregando;
}