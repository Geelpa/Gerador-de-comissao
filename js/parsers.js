if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

async function lerConteudoArquivo(file) {
    const extensao = file.name.split('.').pop().toLowerCase();
    if (extensao === 'pdf') return extrairTextoPDF(file);
    if (['csv', 'txt'].includes(extensao)) return extrairTextoCSVouTXT(file);
    if (['xls', 'xlsx'].includes(extensao)) return extrairTextoExcel(file);
    throw new Error(`Formato não suportado: .${extensao}. Anexe um arquivo PDF, CSV, TXT, XLS ou XLSX.`);
}

async function extrairTextoExcel(file) {
    if (typeof XLSX === 'undefined') {
        throw new Error('A biblioteca de leitura de planilhas não foi carregada.');
    }

    const planilha = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const linhas = [];

    for (const nomeAba of planilha.SheetNames) {
        const aba = planilha.Sheets[nomeAba];
        const registros = XLSX.utils.sheet_to_json(aba, {
            header: 1,
            defval: '',
            raw: false,
            dateNF: 'dd/mm/yyyy'
        });
        linhas.push(...registros.map(registro =>
            registro.map(valor => String(valor).replace(/[\t\r\n]/g, ' ')).join('\t')
        ));
    }

    return linhas.join('\n');
}

async function extrairTextoPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('A biblioteca de leitura de PDF não foi carregada.');
    }

    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const paginas = [];

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
        const pagina = await pdf.getPage(numeroPagina);
        const conteudo = await pagina.getTextContent();
        const linhas = [];

        for (const item of conteudo.items) {
            if (!item.str || !item.str.trim()) continue;

            const y = item.transform[5];
            let linha = linhas.find(candidata => Math.abs(candidata.y - y) < 3);
            if (!linha) {
                linha = { y, itens: [] };
                linhas.push(linha);
            }
            linha.itens.push({ x: item.transform[4], texto: item.str.trim() });
        }

        paginas.push(linhas
            .sort((a, b) => b.y - a.y)
            .map(linha => linha.itens
                .sort((a, b) => a.x - b.x)
                .map(item => item.texto)
            .join('\t')
            )
            .join('\n'));
    }

    return paginas.join('\n');
}

function extrairTextoCSVouTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target.result || '').replace(/^\uFEFF/, ''));
        reader.onerror = () => reject(reader.error || new Error('Não foi possível ler o arquivo.'));
        reader.readAsText(file, 'UTF-8');
    });
}

async function extrairDadosDoc01(file) {
    const dados = extrairDadosVendas(await lerConteudoArquivo(file));
    if (!dados.lista.length && !dados.totalAtivacoes && !dados.totalValor) {
        throw new Error('O relatório de vendas não contém dados reconhecíveis.');
    }
    return { ...dados, vendas: dados.lista };
}

async function extrairDadosDoc02(file) {
    const dados = extrairDadosUpgrades(await lerConteudoArquivo(file));
    if (!dados.lista.length && !dados.totalDiferenca) {
        throw new Error('O relatório de upgrades não contém dados reconhecíveis.');
    }
    return { ...dados, upgrades: dados.lista };
}

function extrairDadosVendas(texto) {
    const vendedorMatch = texto.match(/Usuário:\s*([^\n\r|,]+)/i);
    const totalContratosMatch = texto.match(/Contratos:\s*([\d.]+)/i);
    const totalValorMatch = texto.match(/Valor:\s*(?:R\$\s*)?([\d.,]+)/i);
    const lista = [];
    let somaCalculada = 0;
    let indiceColunaPessoa = -1;
    let colunasVenda;

    for (const linha of texto.split(/\r?\n/)) {
        const indiceEncontrado = indiceColunaPessoaNoCabecalho(linha);
        if (indiceEncontrado >= 0) indiceColunaPessoa = indiceEncontrado;
        const colunasEncontradas = mapearColunasVendas(linha);
        if (colunasEncontradas) {
            colunasVenda = colunasEncontradas;
            indiceColunaPessoa = colunasEncontradas.vendedor;
        }

        const venda = interpretarLinhaVenda(linha, indiceColunaPessoa, colunasVenda);
        if (!venda) continue;
        somaCalculada += venda.valor;
        lista.push(venda);
    }

    return {
        vendedor: vendedorMatch ? vendedorMatch[1].trim() : '',
        totalAtivacoes: totalContratosMatch
            ? parseInt(totalContratosMatch[1].replace(/\./g, ''), 10)
            : lista.length,
        totalValor: totalValorMatch ? converterParaNumero(totalValorMatch[1]) : somaCalculada,
        lista
    };
}

function interpretarLinhaVenda(linha, indiceColunaPessoa = -1, colunasVenda) {
    const limpa = linha.trim();
    if (!limpa || /^(id|cliente|contrato|data|total)\b/i.test(limpa)) return null;

    const separador = detectarSeparador(limpa);
    if (separador) {
        if (colunasVenda) {
            const colunas = alinharColunasVenda(
                dividirLinha(limpa, colunasVenda.separador).map(coluna => coluna.trim()),
                colunasVenda
            );
            const dataAtivacao = colunas[colunasVenda.dataAtivacao] || '';
            const valor = converterParaNumero(colunas[colunasVenda.valor] || '');
            const id = colunas[colunasVenda.id] || '';
            const cliente = colunas[colunasVenda.cliente] || '';
            const vendedor = colunas[colunasVenda.vendedor] || '';
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataAtivacao) && id && cliente && vendedor && Number.isFinite(valor)) {
                return {
                    id,
                    cliente,
                    contratoId: '',
                    plano: colunas[colunasVenda.plano] || '',
                    dataAtivacao,
                    renovacao: colunasVenda.renovacao >= 0 ? colunas[colunasVenda.renovacao] || '' : '',
                    valor,
                    vendedor
                };
            }
            return null;
        }
        const colunas = dividirLinha(limpa, separador).map(coluna => coluna.trim());
        const vendedor = indiceColunaPessoa >= 0 ? colunas[indiceColunaPessoa] || '' : '';
        if (indiceColunaPessoa >= 0) colunas.splice(indiceColunaPessoa, 1);
        if (colunas.length >= 6 && /^\d{1,8}$/.test(colunas[0]) && /^\d{1,8}$/.test(colunas[2])) {
            const dataIndex = colunas.findIndex(coluna => /^\d{2}\/\d{2}\/\d{4}$/.test(coluna));
            if (dataIndex >= 4 && dataIndex < colunas.length - 1) {
                const valor = converterParaNumero(colunas[colunas.length - 1]);
                if (Number.isFinite(valor)) {
                    return {
                        id: colunas[0],
                        cliente: colunas[1],
                        contratoId: colunas[2],
                        plano: colunas.slice(3, dataIndex).join(' '),
                        dataAtivacao: colunas[dataIndex],
                        renovacao: colunas.length - dataIndex > 2 ? colunas[dataIndex + 1] : '',
                        valor,
                        vendedor
                    };
                }
            }
        }
    }

    const match = limpa.match(/^(\d{1,8})\s+(.+?)\s+(\d{1,8})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s*(?:R\$\s*)?([\d.,]+)$/i);
    if (!match) return null;

    const colunasLinha = separador ? dividirLinha(limpa, separador).map(coluna => coluna.trim()) : [];
    return {
        id: match[1],
        cliente: match[2].trim(),
        contratoId: match[3],
        plano: match[4].trim(),
        dataAtivacao: match[5],
        renovacao: match[6].trim(),
        valor: converterParaNumero(match[7]),
        vendedor: indiceColunaPessoa >= 0 ? colunasLinha[indiceColunaPessoa] || '' : ''
    };
}

function extrairDadosUpgrades(texto) {
    const vendedorMatch = texto.match(/Usuário:\s*([^\n\r|,]+)/i);
    const totalDiferencaMatch = texto.match(/Diferença de valor:\s*(?:R\$\s*)?([\d.,]+)/i);
    const lista = [];
    let somaDiferencas = 0;
    let indiceColunaPessoa = -1;
    let colunasUpgrade;

    for (const linha of texto.split(/\r?\n/)) {
        const indiceEncontrado = indiceColunaPessoaNoCabecalho(linha);
        if (indiceEncontrado >= 0) indiceColunaPessoa = indiceEncontrado;
        const colunasEncontradas = mapearColunasUpgrades(linha);
        if (colunasEncontradas) {
            colunasUpgrade = colunasEncontradas;
            indiceColunaPessoa = colunasEncontradas.vendedor;
        }

        const upgrade = interpretarLinhaUpgrade(linha, indiceColunaPessoa, colunasUpgrade);
        if (!upgrade) continue;
        if (upgrade.diferenca > 0) somaDiferencas += upgrade.diferenca;
        lista.push(upgrade);
    }

    return {
        vendedor: vendedorMatch ? vendedorMatch[1].trim() : '',
        totalDiferenca: lista.length
            ? somaDiferencas
            : Math.max(0, converterParaNumero(totalDiferencaMatch?.[1])),
        lista
    };
}

function interpretarLinhaUpgrade(linha, indiceColunaPessoa = -1, colunasUpgrade) {
    const limpa = linha.trim();
    if (!limpa || /^(contrato|data|tipo|total)\b/i.test(limpa)) return null;

    if (colunasUpgrade) {
        const colunas = dividirLinha(limpa, colunasUpgrade.separador).map(coluna => coluna.trim());
        const contrato = colunas[colunasUpgrade.contrato] || '';
        const data = colunas[colunasUpgrade.data] || '';
        const tipo = colunas[colunasUpgrade.tipo] || '';
        const vendedor = colunas[colunasUpgrade.vendedor] || '';
        if (!/^\d{1,8}$/.test(contrato) || !/^\d{2}\/\d{2}\/\d{4}$/.test(data) || !tipo || !vendedor) {
            return null;
        }

        let indiceValor = colunasUpgrade.valorAnterior;
        const valores = [];
        for (let indice = 0; indice < 3; indice++) {
            const resultado = lerValorUpgrade(colunas, indiceValor);
            if (!resultado) {
                valores.push(0);
                continue;
            }
            valores.push(resultado.valor);
            indiceValor = resultado.proximoIndice;
        }

        return {
            contrato,
            data,
            tipo,
            vendedor,
            valorAnterior: valores[0],
            valorNovo: valores[1],
            diferenca: valores[2]
        };
    }

    const linhaPDF = limpa.match(/^(\d{1,8})\s+(\d{2}\/\d{2}\/\d{4})\s+Upgrade\b\s+(.+)$/i);
    if (!detectarSeparador(limpa) && linhaPDF) {
        const valores = [...linhaPDF[3].matchAll(/-?(?:\d{1,3}(?:\.\d{3})+|\d+)[,.]\d{2}/g)];
        if (valores.length >= 3) {
            const vendedor = linhaPDF[3].slice(0, valores[0].index).trim();
            if (vendedor) {
                return {
                    contrato: linhaPDF[1],
                    data: linhaPDF[2],
                    tipo: 'Upgrade',
                    vendedor,
                    valorAnterior: converterParaNumero(valores[0][0]),
                    valorNovo: converterParaNumero(valores[1][0]),
                    diferenca: converterParaNumero(valores[2][0])
                };
            }
        }
    }

    const separador = detectarSeparador(limpa);
    if (separador) {
        const colunas = dividirLinha(limpa, separador).map(coluna => coluna.trim());
        const vendedor = indiceColunaPessoa >= 0 ? colunas[indiceColunaPessoa] || '' : '';
        if (indiceColunaPessoa >= 0) colunas.splice(indiceColunaPessoa, 1);
        if (colunas.length >= 6 && /^\d{1,8}$/.test(colunas[0]) &&
            /^\d{2}\/\d{2}\/\d{4}$/.test(colunas[1])) {
            const valores = colunas.slice(-3).map(converterParaNumero);
            if (valores.every(Number.isFinite)) {
                return {
                    contrato: colunas[0],
                    data: colunas[1],
                    tipo: colunas.slice(2, -3).find(valor => /upgrade/i.test(valor)) || 'Upgrade',
                    vendedor,
                    valorAnterior: valores[0],
                    valorNovo: valores[1],
                    diferenca: valores[2]
                };
            }
        }
    }

    const match = limpa.match(/^(\d{1,8})\s+(\d{2}\/\d{2}\/\d{4})\s+Upgrade\s+.+?\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/i);
    if (!match) return null;

    const colunasLinha = separador ? dividirLinha(limpa, separador).map(coluna => coluna.trim()) : [];
    return {
        contrato: match[1],
        data: match[2],
        tipo: 'Upgrade',
        vendedor: indiceColunaPessoa >= 0 ? colunasLinha[indiceColunaPessoa] || '' : '',
        valorAnterior: converterParaNumero(match[3]),
        valorNovo: converterParaNumero(match[4]),
        diferenca: converterParaNumero(match[5])
    };
}

function indiceColunaPessoaNoCabecalho(linha) {
    const separador = detectarSeparador(linha);
    if (!separador) return -1;

    return dividirLinha(linha, separador).findIndex(coluna => {
        const cabecalho = normalizarCabecalho(coluna);
        return /(^| )(vendedor|usuario|funcionario|colaborador|atendente|consultor)( |$)/.test(cabecalho);
    });
}

function mapearColunasVendas(linha) {
    const separador = detectarSeparador(linha);
    if (!separador) return null;

    const cabecalhos = dividirLinha(linha, separador).map(normalizarCabecalho);
    const localizar = aliases => cabecalhos.findIndex(cabecalho =>
        aliases.some(alias => typeof alias === 'string' ? cabecalho === alias : alias.test(cabecalho))
    );
    const colunas = {
        dataAtivacao: localizar(['ativacao', 'data ativacao', 'data de ativacao']),
        renovacao: localizar(['renovacao', 'data renovacao']),
        id: localizar(['id', 'id venda', 'codigo', 'codigo venda']),
        cliente: localizar(['cliente', 'nome cliente', 'razao social']),
        plano: localizar(['plano de venda', 'plano', 'nome plano', 'descricao plano']),
        valor: localizar([/^vlr liq(?: mens)?$/, /^valor liq(?:uido)?(?: mensal)?$/, 'valor']),
        vendedor: localizar(['vendedor', 'nome vendedor', 'usuario', 'funcionario', 'colaborador', 'consultor'])
    };

    return colunas.dataAtivacao >= 0 && colunas.id >= 0 && colunas.cliente >= 0 &&
        colunas.plano >= 0 && colunas.valor >= 0 && colunas.vendedor >= 0
        ? { ...colunas, separador }
        : null;
}

function mapearColunasUpgrades(linha) {
    const separador = detectarSeparador(linha);
    if (!separador) return null;

    const cabecalhos = dividirLinha(linha, separador).map(normalizarCabecalho);
    const localizar = aliases => cabecalhos.findIndex(cabecalho => aliases.includes(cabecalho));
    const colunas = {
        contrato: localizar(['contrato', 'id contrato']),
        data: localizar(['data alteracao', 'data alteracao upgrade']),
        tipo: localizar(['tipo alt', 'tipo alteracao', 'tipo']),
        vendedor: localizar(['vendedor', 'nome vendedor', 'usuario', 'funcionario', 'colaborador', 'consultor']),
        valorAnterior: localizar(['valor anterior', 'valor antigo']),
        valorNovo: localizar(['valor novo', 'valor atual']),
        diferenca: localizar(['diferenca', 'diferenca de valor'])
    };

    return colunas.contrato >= 0 && colunas.data >= 0 && colunas.tipo >= 0 &&
        colunas.vendedor >= 0 && colunas.valorAnterior >= 0 && colunas.valorNovo >= 0 &&
        colunas.diferenca >= 0
        ? { ...colunas, separador }
        : null;
}

function lerValorUpgrade(colunas, indice) {
    let parteInteira = colunas[indice] || '';
    if (!parteInteira.trim()) return { valor: 0, proximoIndice: indice + 1 };

    const parteDecimal = colunas[indice + 1] || '';
    if (/^-?\s*(?:R\$\s*)?\d[\d.]*$/.test(parteInteira) && /^\d{2}$/.test(parteDecimal)) {
        const valorComDecimal = `${parteInteira},${parteDecimal}`;
        return { valor: converterParaNumero(valorComDecimal), proximoIndice: indice + 2 };
    }

    if (/^-?\s*(?:R\$\s*)?\d[\d.,]*$/.test(parteInteira)) {
        return { valor: converterParaNumero(parteInteira), proximoIndice: indice + 1 };
    }

    return null;
}

function alinharColunasVenda(colunas, mapeamento) {
    const resultado = [...colunas];
    const { id, renovacao, valor } = mapeamento;

    if (renovacao >= 0 && id === renovacao + 1 &&
        /^\d{1,8}$/.test(resultado[id - 1] || '') && !/^\d{1,8}$/.test(resultado[id] || '')) {
        resultado.splice(renovacao, 0, '');
    }

    const parteInteira = resultado[valor] || '';
    const parteDecimal = resultado[valor + 1] || '';
    if (/^-?\d+$/.test(parteInteira) && /^\d{2}$/.test(parteDecimal)) {
        resultado.splice(valor, 2, `${parteInteira},${parteDecimal}`);
    }

    return resultado;
}

function normalizarCabecalho(valor) {
    return String(valor).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarSeparador(linha) {
    if (linha.includes('|')) return '|';
    if (linha.includes('\t')) return '\t';
    if (linha.includes(';')) return ';';
    if (dividirLinha(linha, ',').length >= 6) return ',';
    return null;
}

function dividirLinha(linha, separador) {
    const colunas = [];
    let atual = '';
    let entreAspas = false;

    for (let indice = 0; indice < linha.length; indice++) {
        const caractere = linha[indice];
        if (caractere === '"') {
            if (entreAspas && linha[indice + 1] === '"') {
                atual += '"';
                indice++;
            } else {
                entreAspas = !entreAspas;
            }
        } else if (caractere === separador && !entreAspas) {
            colunas.push(atual);
            atual = '';
        } else {
            atual += caractere;
        }
    }

    colunas.push(atual);
    return colunas;
}

function converterParaNumero(valorTexto) {
    if (valorTexto === null || valorTexto === undefined) return 0;
    let valor = String(valorTexto).trim().replace(/[^\d,.-]/g, '');
    if (!valor) return 0;

    if (valor.includes(',')) {
        valor = valor.replace(/\./g, '').replace(',', '.');
    } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(valor)) {
        valor = valor.replace(/\./g, '');
    }

    return Number.parseFloat(valor) || 0;
}
