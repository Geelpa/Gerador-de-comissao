// Configuração do Worker do PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

async function lerConteudoArquivo(file) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
        return await extrairTextoPDF(file);
    } else {
        return await extrairTextoCSVouTXT(file);
    }
}

async function extrairTextoPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textoCompleto += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    return textoCompleto;
}

function extrairTextoCSVouTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Parsing do Doc 01 (Vendas - 7 colunas IXCSoft)
function extrairDadosVendas(texto) {
    let vendedorMatch = texto.match(/Usuário:\s*([^\n\r\|,]+)/i);
    let vendedor = vendedorMatch ? vendedorMatch[1].trim() : '';

    let totalContratosMatch = texto.match(/Contratos:\s*(\d+)/i);
    let totalValorMatch = texto.match(/Valor:\s*([\d\.,]+)/i);

    const regexLinha = /(\d{4,6})\s*[|,]\s*([^|,\n]+)\s*[|,]\s*(\d{4,6})\s*[|,]\s*([^|,\n]+)\s*[|,]\s*(\d{2}\/\d{2}\/\d{4})\s*(?:[|,]\s*([^|,\n]*))?\s*[|,]\s*([\d\.,]+)/g;
    
    let lista = [];
    let match;
    let somaCalculada = 0;

    while ((match = regexLinha.exec(texto)) !== null) {
        let val = converterParaNumero(match[7]);
        somaCalculada += val;
        lista.push({
            id: match[1].trim(),
            cliente: match[2].trim(),
            contratoId: match[3].trim(),
            plano: match[4].trim(),
            dataAtivacao: match[5].trim(),
            renovacao: match[6] ? match[6].trim() : '',
            valor: val
        });
    }

    let totalAtivacoes = totalContratosMatch ? parseInt(totalContratosMatch[1], 10) : lista.length;
    let totalValor = totalValorMatch ? converterParaNumero(totalValorMatch[1]) : somaCalculada;

    return { vendedor, totalAtivacoes, totalValor, lista };
}

// Parsing do Doc 02 (Upgrades)
function extrairDadosUpgrades(texto) {
    let vendedorMatch = texto.match(/Usuário:\s*([^\n\r\|,]+)/i);
    let vendedor = vendedorMatch ? vendedorMatch[1].trim() : '';

    let totalDiferencaMatch = texto.match(/Diferença de valor:\s*([\d\.,]+)/i);

    const regexLinha = /(\d{4,6})\s*[|,]\s*(\d{2}\/\d{2}\/\d{4})\s*[|,]\s*Upgrade\s*[|,]\s*[^|,\n]+\s*[|,]\s*([\d\.,]+)\s*[|,]\s*([\d\.,]+)\s*[|,]\s*([\d\.,]+)/g;

    let lista = [];
    let match;
    let somaDiferencas = 0;

    while ((match = regexLinha.exec(texto)) !== null) {
        let valAnterior = converterParaNumero(match[3]);
        let valNovo = converterParaNumero(match[4]);
        let dif = converterParaNumero(match[5]);

        if (dif > 0) somaDiferencas += dif;

        lista.push({
            contrato: match[1].trim(),
            data: match[2].trim(),
            tipo: 'Upgrade',
            valorAnterior: valAnterior,
            valorNovo: valNovo,
            diferenca: dif
        });
    }

    let totalDiferenca = totalDiferencaMatch ? converterParaNumero(totalDiferencaMatch[1]) : somaDiferencas;

    return { vendedor, totalDiferenca, lista };
}

function converterParaNumero(valStr) {
    if (!valStr) return 0;
    let limpo = valStr.toString().trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
}