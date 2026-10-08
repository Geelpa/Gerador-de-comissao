// js/app.js

let estadoApp = {};
let arquivosUpload = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const btnProcessar = document.getElementById('btnProcessar');
    const btnDownload = document.getElementById('btnDownload');
    const btnExpandirPrevia = document.getElementById('btnExpandirPrevia');

    if (btnExpandirPrevia) {
        btnExpandirPrevia.addEventListener('click', () => {
            const areaPrevia = btnExpandirPrevia.closest('.app-preview-wrap');
            const expandida = areaPrevia.classList.toggle('is-expanded');
            btnExpandirPrevia.setAttribute('aria-expanded', String(expandida));
            btnExpandirPrevia.textContent = expandida ? 'Recolher prévia' : 'Expandir mais';
        });
    }

    // Captura do Relatório de Vendas (Doc 01)
    if (inputVendas) {
        inputVendas.addEventListener('change', (e) => {
            if (e.target.files[0]) arquivosUpload[0] = e.target.files[0];
        });
    }

    // Captura do Relatório de Upgrades (Doc 02)
    if (inputUpgrades) {
        inputUpgrades.addEventListener('change', (e) => {
            if (e.target.files[0]) arquivosUpload[1] = e.target.files[0];
        });
    }

    // Ação do botão "Processar e Calcular Comissão"
    if (btnProcessar) {
        btnProcessar.addEventListener('click', processarDocumentos);
    }

    // Ação do botão "⬇️ Gerar Documento"
    if (btnDownload) {
        btnDownload.addEventListener('click', executarExportacao);
    }
});

async function processarDocumentos() {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const inputVendedor = document.getElementById('nomeVendedor');
    const nomeVendedor = inputVendedor ? inputVendedor.value.trim() : '';

    if (!nomeVendedor) {
        if (inputVendedor) {
            inputVendedor.setCustomValidity('Informe o nome do vendedor para continuar.');
            inputVendedor.reportValidity();
            inputVendedor.focus();
        }
        return;
    }
    inputVendedor.setCustomValidity('');

    // Busca direta do elemento DOM para evitar perda de referência
    const arq01 = (inputVendas && inputVendas.files[0]) ? inputVendas.files[0] : arquivosUpload[0];
    const arq02 = (inputUpgrades && inputUpgrades.files[0]) ? inputUpgrades.files[0] : arquivosUpload[1];

    if (!arq01) {
        alert("Por favor, anexe ao menos o Relatório de Vendas (Doc 01) para calcular a comissão.");
        return;
    }

    arquivosUpload = [arq01, arq02].filter(Boolean);

    try {
        if (typeof mostrarLoading === 'function') mostrarLoading(true);

        // 1. Extração dos dados via parsers.js
        const dadosBrutosDoc01 = await extrairDadosDoc01(arq01);
        const dadosBrutosDoc02 = arq02
            ? await extrairDadosDoc02(arq02)
            : { vendedor: '', totalDiferenca: 0, upgrades: [] };

        // 4. Leitura da Meta configurada na tela
        const elMeta = document.getElementById('metaAtivacoes');
        const metaDefinida = elMeta ? (parseInt(elMeta.value, 10) || 84) : 84;

        // 5. Cálculo do Resumo
        const resultadoCalculo = calcularComissaoTotal({
            dadosVendas: {
                ...dadosBrutosDoc01,
                vendedor: nomeVendedor,
                lista: dadosBrutosDoc01.vendas
            },
            dadosUpgrades: {
                ...dadosBrutosDoc02,
                lista: dadosBrutosDoc02.upgrades
            },
            metaAtivacoes: metaDefinida
        });
        const resumoCalculado = resultadoCalculo.resumo;

        // 6. Atualização da Porcentagem Calculada no painel de configurações
        const elPorcentagem = document.getElementById('comissaoPorcentagem');
        if (elPorcentagem && resumoCalculado.porcentagemUtilizada !== undefined) {
            elPorcentagem.value = resumoCalculado.porcentagemUtilizada;
        }

        // 7. Objeto Global da Aplicação
        estadoApp = {
            ...resultadoCalculo,
            vendedor: nomeVendedor,
            arquivosAnexados: arquivosUpload
        };

        // 8. Exibição dos resultados na tela
        const areaResultados = document.getElementById('areaResultados');
        if (areaResultados) areaResultados.classList.remove('hidden');

        if (typeof atualizarPainelResumo === 'function') {
            atualizarPainelResumo(estadoApp);
        }

        const previaRelatorio = document.getElementById('previaRelatorio');
        if (previaRelatorio) previaRelatorio.srcdoc = gerarHTMLRelatorio(estadoApp);

    } catch (erro) {
        console.error("Erro ao processar documentos:", erro);
        alert(`Falha ao ler os documentos anexados: ${erro.message || erro}`);
    } finally {
        if (typeof mostrarLoading === 'function') mostrarLoading(false);
    }
}

function executarExportacao() {
    if (!estadoApp.vendas || estadoApp.vendas.length === 0) {
        alert("Por favor, processe os documentos antes de gerar o arquivo.");
        return;
    }

    const formatoSelect = document.getElementById('formatoExportacao');
    const formato = formatoSelect ? formatoSelect.value : 'pdf';

    if (formato === 'pdf' && typeof exportarPDF === 'function') {
        exportarPDF(estadoApp);
    } else if (formato === 'xlsx' && typeof exportarXLSX === 'function') {
        exportarXLSX(estadoApp);
    } else if (formato === 'csv' && typeof exportarCSV === 'function') {
        exportarCSV(estadoApp);
    } else {
        alert("Função de exportação não encontrada para o formato selecionado.");
    }
}