// js/pdfExporter.js

function gerarNomeArquivoComissao(dadosExportacao) {
    const datas = [
        ...(Array.isArray(dadosExportacao.vendas) ? dadosExportacao.vendas : [])
            .map(venda => venda.dataAtivacao || venda.data_ativacao || venda.data),
        ...(Array.isArray(dadosExportacao.upgrades) ? dadosExportacao.upgrades : [])
            .map(upgrade => upgrade.data || upgrade.data_alteracao)
    ].map(data => {
        const brasileira = String(data || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (brasileira) return new Date(Date.UTC(Number(brasileira[3]), Number(brasileira[2]) - 1, Number(brasileira[1])));

        const iso = String(data || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));

        return null;
    }).filter(data => data && !Number.isNaN(data.getTime()));

    datas.sort((a, b) => a - b);
    const periodo = datas.length
        ? new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(datas[0])
        : 'período não identificado';
    const periodoFormatado = periodo.charAt(0).toLocaleUpperCase('pt-BR') + periodo.slice(1);
    const vendedor = String(dadosExportacao.vendedor || 'Vendedor não identificado')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return `comissao ${periodoFormatado} ${vendedor}`;
}

function baixarArquivo(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportarPDF(dadosExportacao) {
    if (typeof definirEstadoBotaoDownload === 'function') definirEstadoBotaoDownload(true);

    // Container Fixo: Impede que o PDF saia descentralizado ou cortado
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-10000px';
    tempContainer.style.width = '1060px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-1';
    tempContainer.style.opacity = '1';
    tempContainer.style.pointerEvents = 'none';

    tempContainer.innerHTML = gerarHTMLRelatorio(dadosExportacao, true);
    document.body.appendChild(tempContainer);

    const nomeBase = gerarNomeArquivoComissao(dadosExportacao);

    const opcoes = {
        margin:       [8, 5, 8, 5],
        filename:     `${nomeBase}.pdf`,
        image:        { type: 'jpeg', quality: 0.92 },
        html2canvas:  { 
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true, 
            logging: false,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            windowWidth: 1060
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
        // Gera o PDF silenciosamente em segundo plano (Blob)
        const relatorioPDF = tempContainer.querySelector('#conteudoRelatorioPDF');
        if (!relatorioPDF) throw new Error('O conteúdo do relatório PDF não foi encontrado.');
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(resolve));
        const pdfBlob = await html2pdf().set(opcoes).from(relatorioPDF).output('blob');

        if (typeof definirEstadoBotaoDownload === 'function') {
            definirEstadoBotaoDownload(true, 'Preparando PDF...');
        }
        baixarArquivo(pdfBlob, `${nomeBase}.pdf`);
    } catch (err) {
        console.error("Erro na geração do PDF:", err);
        alert("Erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
        if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
        if (typeof definirEstadoBotaoDownload === 'function') definirEstadoBotaoDownload(false);
    }
}

function exportarXLSX(dadosExportacao) {
    const wb = XLSX.utils.book_new();
    const funcionario = dadosExportacao.perfilComissao === 'funcionario';
    const resumoSheet = [
        ["RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES"],
        [funcionario ? "Funcionário" : "Vendedor", dadosExportacao.vendedor || 'Consultor'],
        ["Perfil", funcionario ? "Funcionário" : "Vendedor"],
        [""],
        ["RESUMO DA COMISSÃO"],
        ["Total de Ativações", dadosExportacao.resumo ? dadosExportacao.resumo.totalAtivacoes : 0],
        ["Meta (100%)", dadosExportacao.resumo ? dadosExportacao.resumo.metaAtivacoes : 0],
        [funcionario ? "Meta Atingida Informada (vendas)" : "Ativações Realizadas", funcionario
            ? (dadosExportacao.resumo ? dadosExportacao.resumo.metaAtingidaFuncionario : 0)
            : (dadosExportacao.resumo ? dadosExportacao.resumo.totalAtivacoes : 0)],
        ...(funcionario ? [
            ["Percentual de Alcance", `${dadosExportacao.resumo ? dadosExportacao.resumo.percentualAlcance : 0}%`],
            ["Vendas consideradas", dadosExportacao.resumo ? dadosExportacao.resumo.vendasComissionaveis : 0],
            ["Comissão por venda (R$)", dadosExportacao.resumo ? dadosExportacao.resumo.valorPorVenda : 0]
        ] : [
            ["Faixa de comissão", `${dadosExportacao.resumo ? dadosExportacao.resumo.porcentagemUtilizada : 0}%`]
        ]),
        ["Total Vendas (R$)", dadosExportacao.resumo ? dadosExportacao.resumo.totalValorVendas : 0],
        ["Diferença Upgrades (R$)", dadosExportacao.resumo ? dadosExportacao.resumo.totalUpgrades : 0],
        ["Comissão Vendas (R$)", dadosExportacao.resumo ? dadosExportacao.resumo.comissaoVendas : 0],
        ["Comissão Total Final (R$)", dadosExportacao.resumo ? dadosExportacao.resumo.comissaoTotal : 0]
    ];

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoSheet);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    if (dadosExportacao.vendas && dadosExportacao.vendas.length > 0) {
        const vendasSemRenovacao = dadosExportacao.vendas.map(({ renovacao, is_renovacao, ...venda }) => venda);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendasSemRenovacao), "Vendas");
    }
    if (dadosExportacao.upgrades && dadosExportacao.upgrades.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosExportacao.upgrades), "Upgrades");
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const nomeBase = gerarNomeArquivoComissao(dadosExportacao);
    baixarArquivo(excelBlob, `${nomeBase}.xlsx`);
}

function exportarCSV(dadosExportacao) {
    const funcionario = dadosExportacao.perfilComissao === 'funcionario';
    const resumo = dadosExportacao.resumo || {};
    const linhasCSV = [];
    const adicionarLinha = campos => {
        linhasCSV.push(campos.map(valor => {
            const texto = String(valor ?? '');
            return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
        }).join(';'));
    };
    const numeroCSV = valor => Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    adicionarLinha(["RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES"]);
    adicionarLinha([funcionario ? 'Funcionário' : 'Vendedor', dadosExportacao.vendedor || 'Consultor']);
    adicionarLinha(['Perfil', funcionario ? 'Funcionário' : 'Vendedor']);
    adicionarLinha(['Ativações', resumo.totalAtivacoes ?? 0]);
    adicionarLinha(['Meta (100%)', resumo.metaAtivacoes ?? 0]);
    if (funcionario) {
        adicionarLinha(['Meta Atingida Informada (vendas)', resumo.metaAtingidaFuncionario ?? 0]);
        adicionarLinha(['Percentual de Alcance', `${resumo.percentualAlcance ?? 0}%`]);
        adicionarLinha(['Vendas consideradas', resumo.vendasComissionaveis ?? 0]);
        adicionarLinha(['Comissão por venda', numeroCSV(resumo.valorPorVenda)]);
    } else {
        adicionarLinha(['Percentual de Alcance', `${resumo.percentualAlcance ?? 0}%`]);
        adicionarLinha(['Faixa de comissão', `${resumo.porcentagemUtilizada ?? 0}%`]);
    }
    adicionarLinha(['Total Vendas', numeroCSV(resumo.totalValorVendas)]);
    adicionarLinha(['Diferença Upgrades', numeroCSV(resumo.totalUpgrades)]);
    adicionarLinha(['Comissão Vendas', numeroCSV(resumo.comissaoVendas)]);
    adicionarLinha(['Comissão Total', numeroCSV(resumo.comissaoTotal)]);

    adicionarLinha([]);
    adicionarLinha(['DETALHAMENTO DE VENDAS']);
    adicionarLinha(['Tipo de Registro', 'ID', 'Cliente', 'Contrato', 'Plano', 'Data de Ativação', 'Valor']);
    for (const venda of dadosExportacao.vendas || []) {
        adicionarLinha([
            'Venda',
            venda.id || venda.codigo || venda.id_venda || '',
            venda.cliente || venda.razao_social || venda.nome_cliente || '',
            venda.contratoId || venda.id_contrato || venda.contrato || '',
            venda.plano || venda.nome_plano || venda.descricao_contrato || '',
            venda.dataAtivacao || venda.data_ativacao || venda.data || '',
            numeroCSV(venda.valor)
        ]);
    }

    adicionarLinha([]);
    adicionarLinha(['DETALHAMENTO DE UPGRADES']);
    adicionarLinha(['Tipo de Registro', 'Contrato', 'Data de Alteração', 'Tipo de Alteração', 'Valor Anterior', 'Valor Novo', 'Diferença']);
    for (const upgrade of dadosExportacao.upgrades || []) {
        adicionarLinha([
            'Upgrade',
            upgrade.contrato || upgrade.id_contrato || '',
            upgrade.data || upgrade.data_alteracao || '',
            upgrade.tipo || upgrade.tipo_alteracao || 'Upgrade',
            numeroCSV(upgrade.valorAnterior ?? upgrade.valor_antigo),
            numeroCSV(upgrade.valorNovo ?? upgrade.valor_atual),
            numeroCSV(upgrade.diferenca)
        ]);
    }

    const csvBlob = new Blob([`\uFEFF${linhasCSV.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const nomeBase = gerarNomeArquivoComissao(dadosExportacao);
    baixarArquivo(csvBlob, `${nomeBase}.csv`);
}