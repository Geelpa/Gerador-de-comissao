// js/app.js

let estadoApp = {};
let arquivosUpload = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const btnProcessar = document.getElementById('btnProcessar');
    const btnDownload = document.getElementById('btnDownload');
    const btnExpandirPrevia = document.getElementById('btnExpandirPrevia');
    const perfilComissaoRadios = document.querySelectorAll('input[name="perfilComissao"]');
    const inputsUpload = [inputVendas, inputUpgrades].filter(Boolean);

    inputsUpload.forEach(input => {
        atualizarEstadoUpload(input);
        input.addEventListener('change', () => atualizarEstadoUpload(input));
    });

    perfilComissaoRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            atualizarConfiguracaoPerfil();
            estadoApp = {};
            const areaResultados = document.getElementById('areaResultados');
            if (areaResultados) areaResultados.classList.add('hidden');
        });
    });
    atualizarConfiguracaoPerfil();

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
            arquivosUpload[0] = e.target.files[0] || null;
        });
    }

    // Captura do Relatório de Upgrades (Doc 02)
    if (inputUpgrades) {
        inputUpgrades.addEventListener('change', (e) => {
            arquivosUpload[1] = e.target.files[0] || null;
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

function atualizarEstadoUpload(input) {
    const areaUpload = input.closest('.app-upload');
    if (!areaUpload) return;

    const arquivoSelecionado = input.files && input.files.length > 0;
    areaUpload.classList.toggle('is-filled', arquivoSelecionado);
    areaUpload.classList.toggle('is-empty', !arquivoSelecionado);

    const statusUpload = areaUpload.querySelector('.app-upload-status');
    if (statusUpload) {
        const nomeArquivo = arquivoSelecionado
            ? input.files[0].name
            : input.required
                ? 'Pendente: anexe o relatório de vendas'
                : 'Opcional: anexe o relatório de upgrades';
        statusUpload.textContent = arquivoSelecionado ? `Anexado: ${nomeArquivo}` : nomeArquivo;
        statusUpload.classList.toggle('is-selected', arquivoSelecionado);
        statusUpload.classList.toggle('is-pending', !arquivoSelecionado);
    }
}

function atualizarConfiguracaoPerfil() {
    const perfil = document.querySelector('input[name="perfilComissao"]:checked')?.value || 'vendedor';
    const funcionario = perfil === 'funcionario';
    const metaVendedorConfig = document.getElementById('metaVendedorConfig');
    const regrasVendedor = document.getElementById('regrasVendedor');
    const configFuncionario = document.getElementById('configFuncionario');
    const labelComissao = document.getElementById('labelComissaoCalculada');
    const ajudaComissao = document.getElementById('ajudaComissaoCalculada');
    const comissaoCalculada = document.getElementById('comissaoPorcentagem');

    if (metaVendedorConfig) metaVendedorConfig.classList.toggle('hidden', funcionario);
    if (regrasVendedor) regrasVendedor.classList.toggle('hidden', funcionario);
    if (configFuncionario) configFuncionario.classList.toggle('hidden', !funcionario);
    if (labelComissao) labelComissao.textContent = funcionario ? 'Comissão por venda' : 'Comissão Calculada';
    if (ajudaComissao) {
        ajudaComissao.textContent = funcionario
            ? 'Valor definido pelo percentual da meta atingida.'
            : 'Calculado automaticamente via faixas (3%, 5%, 7%).';
    }
    if (comissaoCalculada) comissaoCalculada.value = 'A definir';
}

async function processarDocumentos() {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const inputVendedor = document.getElementById('nomeVendedor');
    const nomeVendedor = inputVendedor ? inputVendedor.value.trim() : '';
    const perfilComissao = document.querySelector('input[name="perfilComissao"]:checked')?.value || 'vendedor';

    let metaDefinida;
    let metaAtingidaFuncionario = 0;
    if (perfilComissao === 'funcionario') {
        const inputMetaFixa = document.getElementById('metaFixaFuncionario');
        const inputMetaAtingida = document.getElementById('metaAtingidaFuncionario');
        metaDefinida = Number(inputMetaFixa?.value);
        metaAtingidaFuncionario = Number(inputMetaAtingida?.value);

        if (!Number.isFinite(metaDefinida) || metaDefinida <= 0) {
            inputMetaFixa.setCustomValidity('Informe uma meta fixa maior que zero.');
            inputMetaFixa.reportValidity();
            inputMetaFixa.focus();
            return;
        }
        inputMetaFixa.setCustomValidity('');

        if (!inputMetaAtingida.value || !Number.isInteger(metaAtingidaFuncionario) || metaAtingidaFuncionario < 0) {
            inputMetaAtingida.setCustomValidity('Informe a quantidade de vendas atingida como um número inteiro igual ou maior que zero.');
            inputMetaAtingida.reportValidity();
            inputMetaAtingida.focus();
            return;
        }
        inputMetaAtingida.setCustomValidity('');
    } else {
        const elMeta = document.getElementById('metaAtivacoes');
        metaDefinida = elMeta ? Number(elMeta.value) : NaN;
        if (!Number.isFinite(metaDefinida) || metaDefinida <= 0) {
            elMeta.setCustomValidity('Informe a meta de ativações do vendedor, maior que zero.');
            elMeta.reportValidity();
            elMeta.focus();
            return;
        }
        elMeta.setCustomValidity('');
    }

    if (!nomeVendedor) {
        if (inputVendedor) {
            inputVendedor.setCustomValidity('Informe o nome do vendedor ou funcionário para continuar.');
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
            metaAtivacoes: metaDefinida,
            perfilComissao,
            metaAtingidaFuncionario
        });
        const resumoCalculado = resultadoCalculo.resumo;

        // 6. Atualização da Porcentagem Calculada no painel de configurações
        const elPorcentagem = document.getElementById('comissaoPorcentagem');
        if (elPorcentagem) {
            elPorcentagem.value = perfilComissao === 'funcionario'
                ? `R$ ${resumoCalculado.valorPorVenda.toFixed(2).replace('.', ',')} por venda`
                : `${resumoCalculado.porcentagemUtilizada}%`;
        }

        // 7. Objeto Global da Aplicação
        estadoApp = {
            ...resultadoCalculo,
            vendedor: nomeVendedor,
            perfilComissao,
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