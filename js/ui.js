// js/ui.js

function formatarMoeda(valor) {
    const num = typeof valor === 'number' ? valor : (parseFloat(String(valor || 0).replace(/\./g, '').replace(',', '.')) || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarPainelResumo(dados) {
    const resumo = dados.resumo || {};

    const resTotalAtivacoes = document.getElementById('resTotalAtivacoes');
    const resTotalVendas = document.getElementById('resTotalVendas');
    const resTotalUpgrades = document.getElementById('resTotalUpgrades');
    const resComissao = document.getElementById('resComissao');

    if (resTotalAtivacoes) {
        resTotalAtivacoes.innerText = resumo.totalAtivacoes || dados.vendas?.length || 0;
    }
    if (resTotalVendas) {
        resTotalVendas.innerText = formatarMoeda(resumo.totalValorVendas);
    }
    if (resTotalUpgrades) {
        resTotalUpgrades.innerText = formatarMoeda(resumo.totalUpgrades);
    }
    if (resComissao) {
        resComissao.innerText = formatarMoeda(resumo.comissaoTotal);
    }
}

function mostrarLoading(exibir) {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay && exibir) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center text-white font-bold';
        overlay.innerHTML = '<div class="bg-white text-gray-800 p-6 rounded-lg shadow-xl text-center"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>Processando relatórios...</div>';
        document.body.appendChild(overlay);
    }
    if (overlay) {
        overlay.style.display = exibir ? 'flex' : 'none';
    }
}