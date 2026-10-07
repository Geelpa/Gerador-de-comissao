let estadoApp = null; // Guarda os dados calculados para exportação

document.addEventListener('DOMContentLoaded', () => {
    const btnProcessar = document.getElementById('btnProcessar');
    const btnDownload = document.getElementById('btnDownload');

    if (btnProcessar) {
        btnProcessar.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o submit e recarregamento da página
            iniciarProcessamento();
        });
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o submit e recarregamento da página
            iniciarExportacao();
        });
    }
});

async function iniciarProcessamento() {
    const fileVendasInput = document.getElementById('fileVendas');
    const fileUpgradesInput = document.getElementById('fileUpgrades');

    const temVendas = fileVendasInput.files && fileVendasInput.files.length > 0;
    const temUpgrades = fileUpgradesInput.files && fileUpgradesInput.files.length > 0;

    if (!temVendas && !temUpgrades) {
        alert("Por favor, selecione ao menos um relatório (Vendas ou Upgrades) para processar.");
        return;
    }

    definirEstadoBotaoProcessar(true);

    try {
        let dadosVendas = { vendedor: '', totalAtivacoes: 0, totalValor: 0, lista: [] };
        let dadosUpgrades = { vendedor: '', totalDiferenca: 0, lista: [] };

        if (temVendas) {
            const textoVendas = await lerConteudoArquivo(fileVendasInput.files[0]);
            dadosVendas = extrairDadosVendas(textoVendas);
        }

        if (temUpgrades) {
            const textoUpgrades = await lerConteudoArquivo(fileUpgradesInput.files[0]);
            dadosUpgrades = extrairDadosUpgrades(textoUpgrades);
        }

        const metaAtivacoesInput = document.getElementById('metaAtivacoes');
        const metaAtivacoes = parseInt(metaAtivacoesInput.value, 10) || 84;

        // Calcula comissões via módulo calculator.js
        estadoApp = calcularComissaoTotal({ dadosVendas, dadosUpgrades, metaAtivacoes });

        // Atualiza UI via módulo ui.js
        atualizarInterfaceResultados(estadoApp, temVendas);

    } catch (erro) {
        console.error("Erro no processamento:", erro);
        alert("Erro ao ler arquivos. Certifique-se de que os relatórios são válidos.");
    } finally {
        definirEstadoBotaoProcessar(false);
    }
}

function iniciarExportacao() {
    if (!estadoApp) {
        alert("Processe os documentos antes de exportar o relatório.");
        return;
    }

    const formato = document.getElementById('formatoExportacao').value;

    if (formato === 'pdf') {
        abrirPreviaPDF(estadoApp); // Abre a janela modal com a prévia e botão de download
    } else if (formato === 'xlsx') {
        exportarXLSX(estadoApp);
    } else if (formato === 'csv') {
        exportarCSV(estadoApp);
    }
}