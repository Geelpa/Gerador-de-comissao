const VENDEDORES_CONFIG = [
    { nome: 'Eduardo', metaAtivacoes: 84 },
    { nome: 'Nicole', metaAtivacoes: 84 },
    { nome: 'Jonas', metaAtivacoes: 70 }
];

let arquivosUpload = [];
let dadosExtraidos;
let relatoriosPorPessoa = [];
let estadoApp = {};

document.addEventListener('DOMContentLoaded', () => {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const btnProcessar = document.getElementById('btnProcessar');
    const btnDownload = document.getElementById('btnDownload');
    const btnExportarTodos = document.getElementById('btnExportarTodos');
    const btnExpandirPrevia = document.getElementById('btnExpandirPrevia');
    const selecaoRelatorio = document.getElementById('selecaoRelatorioPessoa');
    const configuracaoPessoas = document.getElementById('camposMetasPessoas');
    const metaGeral = document.getElementById('metaGeralFuncionario');
    const inputsUpload = [inputVendas, inputUpgrades].filter(Boolean);

    inputsUpload.forEach(input => {
        atualizarEstadoUpload(input);
        input.addEventListener('change', () => {
            atualizarEstadoUpload(input);
            arquivosUpload[input.id === 'fileVendas' ? 0 : 1] = input.files[0] || null;
            invalidarRelatorios();
        });
    });

    if (btnExpandirPrevia) {
        btnExpandirPrevia.addEventListener('click', () => {
            const areaPrevia = btnExpandirPrevia.closest('.app-preview-wrap');
            const expandida = areaPrevia.classList.toggle('is-expanded');
            btnExpandirPrevia.setAttribute('aria-expanded', String(expandida));
            btnExpandirPrevia.textContent = expandida ? 'Recolher prévia' : 'Expandir mais';
        });
    }

    if (btnProcessar) btnProcessar.addEventListener('click', processarDocumentos);
    if (btnDownload) btnDownload.addEventListener('click', executarExportacao);
    if (btnExportarTodos) btnExportarTodos.addEventListener('click', exportarTodosRelatorios);
    if (configuracaoPessoas) configuracaoPessoas.addEventListener('change', () => {
        if (dadosExtraidos) calcularRelatorios();
    });
    if (metaGeral) metaGeral.addEventListener('change', () => {
        if (dadosExtraidos) calcularRelatorios();
    });
    if (selecaoRelatorio) {
        selecaoRelatorio.addEventListener('change', () => selecionarRelatorio(selecaoRelatorio.value));
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
            : `Opcional: anexe o relatório de ${input.id === 'fileVendas' ? 'vendas' : 'upgrades'}`;
        statusUpload.textContent = arquivoSelecionado ? `Anexado: ${nomeArquivo}` : nomeArquivo;
        statusUpload.classList.toggle('is-selected', arquivoSelecionado);
        statusUpload.classList.toggle('is-pending', !arquivoSelecionado);
    }
}

function invalidarRelatorios() {
    dadosExtraidos = undefined;
    relatoriosPorPessoa = [];
    estadoApp = {};
    atualizarContagemRelatorios();

    const config = document.getElementById('configuracaoPessoas');
    const resultados = document.getElementById('areaResultados');
    const selecao = document.getElementById('selecaoRelatorioWrap');
    const botao = document.getElementById('btnProcessar');
    if (config) config.classList.add('hidden');
    if (resultados) resultados.classList.add('hidden');
    if (selecao) selecao.classList.add('hidden');
    if (botao) botao.textContent = 'Consultar e calcular comissão';
}

function atualizarContagemRelatorios() {
    const quantidade = relatoriosPorPessoa.length;
    const contagem = document.getElementById('contagemPessoasConsultadas');
    const botaoExportarTodos = document.getElementById('btnExportarTodos');
    if (contagem) contagem.textContent = `Pessoas consultadas: ${quantidade}`;
    if (botaoExportarTodos && !botaoExportarTodos.disabled) {
        botaoExportarTodos.textContent = `Exportar Todos (${quantidade})`;
    }
}

function normalizarNomePessoa(nome) {
    return String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function obterConfigVendedor(nome) {
    const normalizado = normalizarNomePessoa(nome);
    return VENDEDORES_CONFIG.find(config => {
        const nomeConfig = normalizarNomePessoa(config.nome);
        return normalizado === nomeConfig || normalizado.startsWith(`${nomeConfig} `);
    });
}

function escaparTextoHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

function agruparDadosPorPessoa(dadosVendas, dadosUpgrades) {
    const pessoas = new Map();
    const obterPessoa = nomeBruto => {
        const nome = String(nomeBruto || '').trim();
        if (!nome) return null;
        const nomeNormalizado = normalizarNomePessoa(nome);
        if (['0 00', 'interno', 'vendedor externo'].includes(nomeNormalizado)) return false;
        const configVendedor = obterConfigVendedor(nome);
        const chave = configVendedor ? normalizarNomePessoa(configVendedor.nome) : nomeNormalizado;
        if (!pessoas.has(chave)) {
            pessoas.set(chave, { nome, vendas: [], upgrades: [] });
        } else {
            const pessoa = pessoas.get(chave);
            if (configVendedor && nome.split(/\s+/).length > pessoa.nome.split(/\s+/).length) {
                pessoa.nome = nome;
            }
        }
        return pessoas.get(chave);
    };

    for (const venda of dadosVendas.vendas || []) {
        const pessoa = obterPessoa(venda.vendedor);
        if (pessoa === false) continue;
        if (!pessoa) {
            throw new Error('Há vendas sem nome de vendedor/funcionário. Confira se o relatório contém essa coluna.');
        }
        pessoa.vendas.push(venda);
    }

    for (const upgrade of dadosUpgrades.upgrades || []) {
        const pessoa = obterPessoa(upgrade.vendedor);
        if (pessoa === false) continue;
        if (!pessoa) {
            throw new Error('Há upgrades sem nome de vendedor/funcionário. Confira se o relatório contém essa coluna.');
        }
        pessoa.upgrades.push(upgrade);
    }

    if (!pessoas.size) {
        throw new Error('Não foi possível identificar pessoas nos relatórios anexados.');
    }

    return [...pessoas.values()].sort((a, b) => {
        const indiceA = VENDEDORES_CONFIG.findIndex(config => obterConfigVendedor(a.nome) === config);
        const indiceB = VENDEDORES_CONFIG.findIndex(config => obterConfigVendedor(b.nome) === config);
        if (indiceA >= 0 || indiceB >= 0) {
            if (indiceA < 0) return 1;
            if (indiceB < 0) return -1;
            return indiceA - indiceB;
        }
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

function exibirCamposMetas(pessoas) {
    const container = document.getElementById('camposMetasPessoas');
    const configuracao = document.getElementById('configuracaoPessoas');
    if (!container || !configuracao) return;

    const vendedores = pessoas.filter(pessoa => obterConfigVendedor(pessoa.nome));
    container.innerHTML = vendedores.map((pessoa, indice) => {
        const vendedor = obterConfigVendedor(pessoa.nome);
        const nomeSeguro = escaparTextoHTML(pessoa.nome);
        const pessoaIndice = pessoas.indexOf(pessoa);
        return `<div class="app-rules rounded border p-3">
                   <label for="metaPessoa${pessoaIndice}" class="block text-sm font-semibold">${nomeSeguro} — meta de ativações (100%)</label>
                   <input id="metaPessoa${pessoaIndice}" data-meta-vendedor="${pessoaIndice}" type="number" min="1" value="${vendedor.metaAtivacoes}" class="app-input mt-1 w-full p-2 border rounded font-bold">
               </div>`;
    }).join('');
    configuracao.classList.toggle('hidden', !vendedores.length);
}

async function processarDocumentos() {
    await lerRelatorios();
}

async function lerRelatorios() {
    const inputVendas = document.getElementById('fileVendas');
    const inputUpgrades = document.getElementById('fileUpgrades');
    const botao = document.getElementById('btnProcessar');
    const arq01 = inputVendas?.files[0] || arquivosUpload[0];
    const arq02 = inputUpgrades?.files[0] || arquivosUpload[1];

    if (!arq01 && !arq02) {
        alert('Por favor, anexe ao menos um dos relatórios (vendas ou upgrades).');
        return;
    }

    try {
        if (typeof mostrarLoading === 'function') mostrarLoading(true);
        const dadosVendas = arq01
            ? await extrairDadosDoc01(arq01)
            : { vendedor: '', totalAtivacoes: 0, totalValor: 0, vendas: [], lista: [] };
        const dadosUpgrades = arq02
            ? await extrairDadosDoc02(arq02)
            : { vendedor: '', totalDiferenca: 0, upgrades: [], lista: [] };
        const pessoas = agruparDadosPorPessoa(dadosVendas, dadosUpgrades);

        dadosExtraidos = { dadosVendas, dadosUpgrades, pessoas, arquivosAnexados: [arq01, arq02].filter(Boolean) };
        exibirCamposMetas(pessoas);
        calcularRelatorios();
    } catch (erro) {
        console.error('Erro ao ler os relatórios:', erro);
        alert(`Falha ao ler os documentos anexados: ${erro.message || erro}`);
        dadosExtraidos = undefined;
    } finally {
        if (typeof mostrarLoading === 'function') mostrarLoading(false);
    }
}

function calcularRelatorios() {
    const selecaoAnterior = document.getElementById('selecaoRelatorioPessoa')?.value || '0';
    relatoriosPorPessoa = [];
    estadoApp = {};
    const areaResultados = document.getElementById('areaResultados');
    const selecaoWrap = document.getElementById('selecaoRelatorioWrap');
    if (areaResultados) areaResultados.classList.add('hidden');
    if (selecaoWrap) selecaoWrap.classList.add('hidden');

    const inputMetaGeral = document.getElementById('metaGeralFuncionario');
    const metaGeralFuncionario = Number(inputMetaGeral?.value);
    if (!Number.isInteger(metaGeralFuncionario) || metaGeralFuncionario <= 0) {
        inputMetaGeral.setCustomValidity('Informe uma meta geral maior que zero.');
        inputMetaGeral.reportValidity();
        inputMetaGeral.focus();
        return;
    }
    inputMetaGeral.setCustomValidity('');

    const novosRelatorios = [];
    for (const [indice, pessoa] of dadosExtraidos.pessoas.entries()) {
        const configVendedor = obterConfigVendedor(pessoa.nome);
        const vendas = pessoa.vendas;
        const upgrades = pessoa.upgrades.filter(upgrade => Number(upgrade.diferenca) > 0);
        const metaInput = configVendedor ? document.getElementById(`metaPessoa${indice}`) : null;
        const valorMeta = configVendedor ? Number(metaInput?.value) : vendas.length;

        if (configVendedor && (!Number.isInteger(valorMeta) || valorMeta <= 0)) {
            metaInput.setCustomValidity('Informe uma meta de ativações maior que zero.');
            metaInput.reportValidity();
            metaInput.focus();
            return;
        }
        if (metaInput) metaInput.setCustomValidity('');

        const resultado = calcularComissaoTotal({
            dadosVendas: {
                vendedor: pessoa.nome,
                totalAtivacoes: vendas.length,
                totalValor: vendas.reduce((total, venda) => total + Number(venda.valor || 0), 0),
                lista: vendas
            },
            dadosUpgrades: {
                vendedor: pessoa.nome,
                totalDiferenca: upgrades.reduce((total, upgrade) =>
                    total + Math.max(0, Number(upgrade.diferenca) || 0), 0),
                lista: upgrades
            },
            metaAtivacoes: configVendedor ? valorMeta : metaGeralFuncionario,
            perfilComissao: configVendedor ? 'vendedor' : 'funcionario',
            metaAtingidaFuncionario: configVendedor ? 0 : valorMeta
        });

        novosRelatorios.push({
            ...resultado,
            vendedor: pessoa.nome,
            arquivosAnexados: dadosExtraidos.arquivosAnexados
        });
    }

    relatoriosPorPessoa = novosRelatorios;
    atualizarContagemRelatorios();
    const selecao = document.getElementById('selecaoRelatorioPessoa');
    if (selecao) {
        selecao.innerHTML = relatoriosPorPessoa.map((relatorio, indice) =>
            `<option value="${indice}">${escaparTextoHTML(relatorio.vendedor)}</option>`
        ).join('');
    }
    if (selecaoWrap) selecaoWrap.classList.remove('hidden');
    if (areaResultados) areaResultados.classList.remove('hidden');
    const indiceSelecionado = Number(selecaoAnterior) < relatoriosPorPessoa.length ? selecaoAnterior : '0';
    if (selecao) selecao.value = indiceSelecionado;
    selecionarRelatorio(indiceSelecionado);
}

function selecionarRelatorio(indice) {
    const relatorio = relatoriosPorPessoa[Number(indice)];
    if (!relatorio) return;

    estadoApp = relatorio;
    if (typeof atualizarPainelResumo === 'function') atualizarPainelResumo(relatorio);
    const previa = document.getElementById('previaRelatorio');
    if (previa) previa.srcdoc = gerarHTMLRelatorio(relatorio);
}

function executarExportacao() {
    if (!estadoApp.resumo || !Array.isArray(estadoApp.vendas) || !Array.isArray(estadoApp.upgrades)) {
        alert('Consulte os relatórios antes de exportar.');
        return;
    }

    const formatoSelect = document.getElementById('formatoExportacao');
    const formato = formatoSelect ? formatoSelect.value : 'pdf';
    if (formato === 'pdf' && typeof exportarPDF === 'function') {
        exportarPDF(estadoApp).catch(erro => {
            alert(`Falha ao gerar o PDF: ${erro.message || erro}`);
        });
    } else if (formato === 'xlsx' && typeof exportarXLSX === 'function') {
        exportarXLSX(estadoApp);
    } else if (formato === 'csv' && typeof exportarCSV === 'function') {
        exportarCSV(estadoApp);
    } else {
        alert('Função de exportação não encontrada para o formato selecionado.');
    }
}

async function exportarTodosRelatorios() {
    if (!relatoriosPorPessoa.length) {
        alert('Consulte os relatórios antes de exportar.');
        return;
    }

    const formatoSelect = document.getElementById('formatoExportacao');
    if (formatoSelect && formatoSelect.value !== 'pdf') {
        formatoSelect.value = 'pdf';
    }
    const botao = document.getElementById('btnExportarTodos');
    if (botao) {
        botao.disabled = true;
        botao.setAttribute('aria-busy', 'true');
    }

    try {
        for (let indice = 0; indice < relatoriosPorPessoa.length; indice++) {
            if (botao) botao.textContent = `Gerando ${indice + 1} de ${relatoriosPorPessoa.length}...`;
            await exportarPDF(relatoriosPorPessoa[indice], { manageButtonState: false });
            if (indice < relatoriosPorPessoa.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    } catch (erro) {
        console.error('Erro ao exportar todos os relatórios:', erro);
        alert(`Falha ao gerar os PDFs: ${erro.message || erro}`);
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.removeAttribute('aria-busy');
            botao.textContent = `Exportar Todos (${relatoriosPorPessoa.length})`;
        }
    }
}
