// js/pdfExporter.js

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

    const nomeBase = (dadosExportacao.vendedor || 'consultor')
                        .replace(/Data do Relatório.*/g, '')
                        .trim()
                        .replaceAll(' ', '_')
                        .toLowerCase();

    const opcoes = {
        margin:       [8, 5, 8, 5],
        filename:     `relatorio_comissao_${nomeBase}.pdf`,
        image:        { type: 'png', quality: 1 },
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
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
        // Gera o PDF silenciosamente em segundo plano (Blob)
        const relatorioPDF = tempContainer.querySelector('#conteudoRelatorioPDF');
        if (!relatorioPDF) throw new Error('O conteúdo do relatório PDF não foi encontrado.');
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(resolve));
        const pdfBlob = await html2pdf().set(opcoes).from(relatorioPDF).output('blob');

        // Empacota o PDF e os anexos em um ZIP
        if (typeof definirEstadoBotaoDownload === 'function') {
            definirEstadoBotaoDownload(true, 'Preparando download...');
        }
        await baixarPacoteZip(dadosExportacao, pdfBlob, `relatorio_comissao_${nomeBase}.pdf`);
    } catch (err) {
        console.error("Erro na geração do PDF:", err);
        alert("Erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
        if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
        if (typeof definirEstadoBotaoDownload === 'function') definirEstadoBotaoDownload(false);
    }
}

// Função utilitária para agrupar relatório + anexos originais no ZIP
async function baixarPacoteZip(dadosExportacao, blobRelatorio, nomeRelatorio) {
    if (typeof JSZip === 'undefined') {
        alert("Biblioteca JSZip não encontrada. Por favor, adicione o script no index.html.");
        return;
    }

    const zip = new JSZip();

    // 1. Adiciona o relatório gerado (PDF, XLSX ou CSV) ao ZIP
    zip.file(nomeRelatorio, blobRelatorio);

    // 2. Adiciona os arquivos anexados pelo usuário (se existirem)
    if (dadosExportacao.arquivosAnexados && dadosExportacao.arquivosAnexados.length > 0) {
        dadosExportacao.arquivosAnexados.forEach((arquivo, index) => {
            zip.file(arquivo.name || `documento_anexo_${index + 1}`, arquivo);
        });
    }

    // 3. Compacta e força o download
    const zipContent = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipContent);
    link.download = `fechamento_comissao.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportarXLSX(dadosExportacao) {
    const wb = XLSX.utils.book_new();
    const resumoSheet = [
        ["RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES"],
        ["Vendedor", dadosExportacao.vendedor || 'Consultor'],
        [""],
        ["RESUMO DA COMISSÃO"],
        ["Total de Ativações", dadosExportacao.resumo ? dadosExportacao.resumo.totalAtivacoes : 0],
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

    baixarPacoteZip(dadosExportacao, excelBlob, "relatorio_comissao.xlsx");
}

function exportarCSV(dadosExportacao) {
    let csvContent = "\uFEFF";
    csvContent += "RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES\n";
    csvContent += `Vendedor;${dadosExportacao.vendedor || 'Consultor'}\n`;
    csvContent += `Ativações;${dadosExportacao.resumo ? dadosExportacao.resumo.totalAtivacoes : 0}\n`;
    csvContent += `Total Vendas;${dadosExportacao.resumo ? dadosExportacao.resumo.totalValorVendas : 0}\n`;
    csvContent += `Diferença Upgrades;${dadosExportacao.resumo ? dadosExportacao.resumo.totalUpgrades : 0}\n`;
    csvContent += `Comissão Vendas;${dadosExportacao.resumo ? dadosExportacao.resumo.comissaoVendas : 0}\n`;
    csvContent += `Comissão Total;${dadosExportacao.resumo ? dadosExportacao.resumo.comissaoTotal : 0}\n`;

    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    baixarPacoteZip(dadosExportacao, csvBlob, "relatorio_comissao.csv");
}