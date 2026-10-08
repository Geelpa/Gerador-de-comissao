// js/pdfExporter.js

function exportarPDF(dadosExportacao) {
    definirEstadoBotaoDownload(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '794px';
    tempContainer.style.backgroundColor = '#ffffff';

    tempContainer.innerHTML = gerarHTMLRelatorio(dadosExportacao);
    document.body.appendChild(tempContainer);

    const opcoes = {
        margin:       [5, 5, 5, 5],
        filename:     `relatorio_comissao_${dadosExportacao.vendedor.replaceAll(' ', '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            windowWidth: 794
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    setTimeout(() => {
        html2pdf().set(opcoes).from(tempContainer.firstElementChild).save().then(() => {
            if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
            definirEstadoBotaoDownload(false);
        }).catch(err => {
            console.error("Erro na geração do PDF:", err);
            if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
            definirEstadoBotaoDownload(false);
        });
    }, 200);
}

function exportarXLSX(dadosExportacao) {
    const wb = XLSX.utils.book_new();
    const resumoSheet = [
        ["RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES"],
        ["Vendedor", dadosExportacao.vendedor],
        [""],
        ["RESUMO DA COMISSÃO"],
        ["Total de Ativações", dadosExportacao.resumo.totalAtivacoes],
        ["Total Vendas (R$)", dadosExportacao.resumo.totalValorVendas],
        ["Diferença Upgrades (R$)", dadosExportacao.resumo.totalUpgrades],
        ["Comissão Vendas (R$)", dadosExportacao.resumo.comissaoVendas],
        ["Comissão Total Final (R$)", dadosExportacao.resumo.comissaoTotal]
    ];

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoSheet);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    if (dadosExportacao.vendas.length > 0) {
        const vendasSemRenovacao = dadosExportacao.vendas.map(({ renovacao, is_renovacao, ...venda }) => venda);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendasSemRenovacao), "Vendas");
    }
    if (dadosExportacao.upgrades.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosExportacao.upgrades), "Upgrades");
    }

    XLSX.writeFile(wb, "relatorio_comissao_ixc.xlsx");
}

function exportarCSV(dadosExportacao) {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES\n";
    csvContent += `Vendedor;${dadosExportacao.vendedor}\n`;
    csvContent += `Ativações;${dadosExportacao.resumo.totalAtivacoes}\n`;
    csvContent += `Total Vendas;${dadosExportacao.resumo.totalValorVendas}\n`;
    csvContent += `Diferença Upgrades;${dadosExportacao.resumo.totalUpgrades}\n`;
    csvContent += `Comissão Vendas;${dadosExportacao.resumo.comissaoVendas}\n`;
    csvContent += `Comissão Total;${dadosExportacao.resumo.comissaoTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_comissao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}