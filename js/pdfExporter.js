// js/pdfExporter.js

// 1. Função base que gera a estrutura HTML do relatório IXCSoft
function gerarHTMLRelatorio(dadosExportacao) {
    return `
        <div id="conteudoRelatorioPDF" style="font-family: Arial, Helvetica, sans-serif; color: #000000; padding: 25px 30px; font-size: 9.5px; line-height: 1.3; background: #ffffff; width: 734px; box-sizing: border-box; margin: 0 auto; text-align: left;">
            
            <!-- Cabeçalho Principal IXCSoft -->
            <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000000; padding-bottom: 8px;">
                <h1 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0; text-transform: uppercase; color: #000000;">${dadosExportacao.empresa}</h1>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 4px; text-align: left;">
                    <tr>
                        <td style="vertical-align: top; width: 50%;">
                            <p style="margin: 1px 0;"><strong>Usuário:</strong> ${dadosExportacao.vendedor}</p>
                            <p style="margin: 1px 0;"><strong>Fone:</strong> ${dadosExportacao.fone}</p>
                            <p style="margin: 1px 0;"><strong>E-mail:</strong> ${dadosExportacao.email}</p>
                            <p style="margin: 1px 0;">${dadosExportacao.endereco}</p>
                        </td>
                        <td style="vertical-align: top; width: 50%; text-align: right;">
                            <p style="margin: 1px 0;"><strong>Data do Relatório:</strong> ${dadosExportacao.dataRelatorio}</p>
                            <p style="margin: 1px 0;"><strong>CNPJ:</strong> ${dadosExportacao.cnpj}</p>
                            <p style="margin: 1px 0;"><strong>IE:</strong> ${dadosExportacao.ie}</p>
                        </td>
                    </tr>
                </table>

                <div style="font-size: 11px; margin-top: 10px; font-weight: bold; text-align: center; text-transform: uppercase; background-color: #f3f4f6; padding: 4px 0;">
                    Relatório Detalhado de Vendas e Ativações
                </div>
            </div>

            <!-- Tabela Detalhada de Vendas (Doc 01) -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5px; table-layout: fixed;">
                <thead>
                    <tr style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; background-color: #e5e7eb; font-weight: bold;">
                        <th style="padding: 4px 2px; text-align: center; width: 7%;">ID</th>
                        <th style="padding: 4px 2px; text-align: left; width: 33%;">Cliente</th>
                        <th style="padding: 4px 2px; text-align: center; width: 8%;">ID Cont.</th>
                        <th style="padding: 4px 2px; text-align: left; width: 27%;">Plano / Contrato</th>
                        <th style="padding: 4px 2px; text-align: center; width: 10%;">Ativação</th>
                        <th style="padding: 4px 2px; text-align: center; width: 7%;">Renov.</th>
                        <th style="padding: 4px 2px; text-align: right; width: 8%;">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosExportacao.vendas.length > 0 ? dadosExportacao.vendas.map(v => `
                        <tr>
                            <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${v.id}</td>
                            <td style="padding: 3px 2px; text-align: left; border-bottom: 1px solid #e5e7eb; word-break: break-word;">${v.cliente}</td>
                            <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${v.contratoId}</td>
                            <td style="padding: 3px 2px; text-align: left; border-bottom: 1px solid #e5e7eb; word-break: break-word;">${v.plano}</td>
                            <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${v.dataAtivacao}</td>
                            <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${v.renovacao || '-'}</td>
                            <td style="padding: 3px 2px; text-align: right; border-bottom: 1px solid #e5e7eb;">${v.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="7" style="text-align: center; color: #6b7280; padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                Nenhum relatório de vendas/ativações anexado para esta consulta.
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>

            <!-- Resumo Financeiro Doc 01 -->
            <div style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; font-weight: bold; padding: 5px 3px; margin-bottom: 14px; display: flex; justify-content: space-between; font-size: 9px; background-color: #fafafa;">
                <span>Total de Ativações: ${dadosExportacao.resumo.totalAtivacoes || 0}</span>
                <span>Valor Total de Vendas: ${formatarMoeda(dadosExportacao.resumo.totalValorVendas)}</span>
            </div>

            <!-- Tabela Detalhada de Upgrades (Doc 02) -->
            ${dadosExportacao.upgrades.length > 0 ? `
                <div style="font-size: 10.5px; text-align: center; margin-top: 12px; margin-bottom: 6px; font-weight: bold; text-transform: uppercase; background-color: #f3f4f6; padding: 4px 0;">
                    Relatório Detalhado de Alterações de Contrato (Upgrades)
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed;">
                    <thead>
                        <tr style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; background-color: #e5e7eb; font-weight: bold;">
                            <th style="padding: 4px 2px; text-align: center; width: 12%;">Contrato</th>
                            <th style="padding: 4px 2px; text-align: center; width: 15%;">Data Alt.</th>
                            <th style="padding: 4px 2px; text-align: left; width: 15%;">Tipo Alt.</th>
                            <th style="padding: 4px 2px; text-align: right; width: 18%;">Valor Anterior</th>
                            <th style="padding: 4px 2px; text-align: right; width: 18%;">Valor Novo</th>
                            <th style="padding: 4px 2px; text-align: right; width: 22%;">Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dadosExportacao.upgrades.map(u => `
                            <tr>
                                <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${u.contrato}</td>
                                <td style="padding: 3px 2px; text-align: center; border-bottom: 1px solid #e5e7eb;">${u.data}</td>
                                <td style="padding: 3px 2px; text-align: left; border-bottom: 1px solid #e5e7eb;">${u.tipo}</td>
                                <td style="padding: 3px 2px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatarMoeda(u.valorAnterior)}</td>
                                <td style="padding: 3px 2px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatarMoeda(u.valorNovo)}</td>
                                <td style="padding: 3px 2px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatarMoeda(u.diferenca)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; font-weight: bold; padding: 5px 3px; margin-bottom: 14px; display: flex; justify-content: space-between; font-size: 9px; background-color: #fafafa;">
                    <span>Total de Upgrades: ${dadosExportacao.upgrades.length}</span>
                    <span>Diferença Total: ${formatarMoeda(dadosExportacao.resumo.totalUpgrades)}</span>
                </div>
            ` : ''}

            <!-- Demonstrativo de Comissão -->
            <div style="border: 1.5px solid #1d4ed8; background-color: #eff6ff; padding: 10px 12px; border-radius: 4px; margin-top: 15px; page-break-inside: avoid;">
                <div style="font-size: 10.5px; font-weight: bold; color: #1e40af; margin-bottom: 6px; border-bottom: 1px solid #93c5fd; padding-bottom: 3px; text-transform: uppercase;">
                    Demonstrativo de Comissão Apurada
                </div>
                <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <p style="margin: 2px 0;"><strong>Meta Padrão (100%):</strong> ${dadosExportacao.resumo.metaAtivacoes} ativações</p>
                            <p style="margin: 2px 0;"><strong>Ativações Realizadas:</strong> ${dadosExportacao.resumo.totalAtivacoes} contratos</p>
                            <p style="margin: 2px 0;"><strong>Percentual de Alcance:</strong> ${dadosExportacao.resumo.percentualAlcance}%</p>
                        </td>
                        <td style="width: 50%; vertical-align: top; text-align: right;">
                            <p style="margin: 2px 0;"><strong>Faixa Aplicada:</strong> ${dadosExportacao.resumo.porcentagemUtilizada}% de comissão</p>
                            <p style="margin: 2px 0;"><strong>Comissão Vendas:</strong> ${formatarMoeda(dadosExportacao.resumo.comissaoVendas)}</p>
                            <p style="margin: 2px 0;"><strong>Comissão Upgrades:</strong> ${formatarMoeda(dadosExportacao.resumo.totalUpgrades)}</p>
                        </td>
                    </tr>
                </table>
                <div style="background-color: #dbeafe; padding: 6px 8px; border-radius: 3px; font-size: 10.5px; font-weight: bold; text-align: right; color: #1e3a8a; margin-top: 6px;">
                    VALOR TOTAL A RECEBER: ${formatarMoeda(dadosExportacao.resumo.comissaoTotal)}
                </div>
            </div>

            <!-- Bloco de Assinaturas -->
            <div style="margin-top: 40px; display: flex; justify-content: space-around; page-break-inside: avoid;">
                <div style="width: 40%; border-top: 1px solid #000000; text-align: center; padding-top: 5px; font-size: 9px;">
                    <strong>${dadosExportacao.vendedor}</strong><br>Assinatura do Vendedor
                </div>
                <div style="width: 40%; border-top: 1px solid #000000; text-align: center; padding-top: 5px; font-size: 9px;">
                    <strong>Gestão / Recursos Humanos</strong><br>Aprovação da Empresa
                </div>
            </div>
        </div>
    `;
}

// 2. Abre a janela de Prévia do Documento
function abrirPreviaPDF(dadosExportacao) {
    const modalExistente = document.getElementById('modalPreviaPDF');
    if (modalExistente) document.body.removeChild(modalExistente);

    const modal = document.createElement('div');
    modal.id = 'modalPreviaPDF';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    modal.style.backdropFilter = 'blur(4px)';
    modal.style.zIndex = '999999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    modal.innerHTML = `
        <div style="background: #ffffff; width: 850px; max-width: 95vw; height: 90vh; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <!-- Barra Superior da Prévia -->
            <div style="padding: 12px 20px; background-color: #1e293b; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; font-size: 14px;">📄 Prévia do Relatório - IXCSoft</div>
                <div style="display: flex; gap: 10px;">
                    <button id="btnBaixarPDFModal" style="background-color: #2563eb; color: #ffffff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">
                        📥 Baixar PDF
                    </button>
                    <button id="btnFecharModal" style="background-color: #475569; color: #ffffff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">
                        ✕ Fechar
                    </button>
                </div>
            </div>

            <!-- Corpo de Visualização Scrollável -->
            <div style="flex: 1; overflow-y: auto; background-color: #f1f5f9; padding: 20px; display: flex; justify-content: center;">
                <div style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); background: #ffffff;">
                    ${gerarHTMLRelatorio(dadosExportacao)}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnFecharModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.getElementById('btnBaixarPDFModal').addEventListener('click', () => {
        exportarPDF(dadosExportacao);
    });
}

// 3. Função de Exportação Silenciosa
function exportarPDF(dadosExportacao) {
    definirEstadoBotaoDownload(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '794px';
    tempContainer.style.opacity = '0.01'; // Fica invisível ao olho humano mas visível para o canvas
    tempContainer.style.zIndex = '-99999';
    tempContainer.style.pointerEvents = 'none';

    tempContainer.innerHTML = gerarHTMLRelatorio(dadosExportacao);
    document.body.appendChild(tempContainer);

    const opcoes = {
        margin:       [8, 8, 8, 8],
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
        [dadosExportacao.empresa],
        ["DEMONSTRATIVO DE COMISSÃO DE VENDAS"],
        ["Vendedor", dadosExportacao.vendedor],
        ["Data da Emissão", dadosExportacao.dataRelatorio],
        [""],
        ["RESUMO FINANCEIRO"],
        ["Total Vendas (R$)", dadosExportacao.resumo.totalValorVendas],
        ["Diferença Upgrades (R$)", dadosExportacao.resumo.totalUpgrades],
        ["Comissão Vendas (R$)", dadosExportacao.resumo.comissaoVendas],
        ["Comissão Total Final (R$)", dadosExportacao.resumo.comissaoTotal]
    ];

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoSheet);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    if (dadosExportacao.vendas.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosExportacao.vendas), "Vendas");
    }
    if (dadosExportacao.upgrades.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosExportacao.upgrades), "Upgrades");
    }

    XLSX.writeFile(wb, "relatorio_comissao_ixc.xlsx");
}

function exportarCSV(dadosExportacao) {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `${dadosExportacao.empresa}\n`;
    csvContent += `Vendedor;${dadosExportacao.vendedor}\n`;
    csvContent += `Comissao Total Final;${dadosExportacao.resumo.comissaoTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_comissao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}