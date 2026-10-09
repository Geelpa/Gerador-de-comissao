function formatarMoeda(valor) {
    const numero = typeof valor === 'number' ? valor : (parseFloat(String(valor || 0).replace(/\./g, '').replace(',', '.')) || 0);
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

function gerarHTMLRelatorio(dadosExportacao, modoImpressao = false) {
    const vendas = Array.isArray(dadosExportacao.vendas) ? dadosExportacao.vendas : [];
    const upgrades = Array.isArray(dadosExportacao.upgrades) ? dadosExportacao.upgrades : [];
    const resumo = dadosExportacao.resumo || {};
    const funcionario = dadosExportacao.perfilComissao === 'funcionario';
    const cores = modoImpressao
        ? {
            texto: '#000000',
            fundo: '#ffffff',
            destaque: '#000000',
            tituloFundo: '#ffffff',
            borda: '#000000',
            bordaLinha: '#000000',
            fundoSuave: '#ffffff'
        }
        : {
            texto: '#f5f0eb',
            fundo: '#130f0c',
            destaque: '#ff852e',
            tituloFundo: '#261e18',
            borda: '#ffffff1c',
            bordaLinha: '#ffffff0a',
            fundoSuave: '#1c1612'
        };
    const fonteBase = modoImpressao ? '13px' : '9.5px';
    const fonteTabela = modoImpressao ? '12px' : '8.5px';
    const alturaLinha = modoImpressao ? '1.15' : '1.3';
    const assinaturaHTML = `
        <div style="margin-top: ${modoImpressao ? '24px' : '55px'}; text-align: center; page-break-inside: avoid; break-inside: avoid;">
            <div style="width: 360px; max-width: 80%; margin: 0 auto; border-top: 1px solid ${cores.borda}; padding-top: 8px; font-size: ${fonteBase};">
                <strong>Assinatura do Vendedor / Funcionário</strong><br>
                <span style="font-size: ${modoImpressao ? '14px' : '8.5px'}; color: ${modoImpressao ? '#000000' : '#9c8e85'};">(Termo de Ciência da Comissão)</span>
            </div>
        </div>
    `;
    const quebraAntesResumo = modoImpressao && upgrades.length >= 12;

    return `
        <div id="conteudoRelatorioPDF" style="font-family: Arial, Helvetica, sans-serif; color: ${cores.texto}; padding: ${modoImpressao ? '10px 18px' : '20px 25px'}; font-size: ${fonteBase}; line-height: ${alturaLinha}; background: ${cores.fundo}; width: 100%; max-width: ${modoImpressao ? '1060px' : '794px'}; box-sizing: border-box; margin: 0 auto; text-align: left;">
            <section>
                <div style="font-size: ${modoImpressao ? '15px' : '13px'}; font-weight: bold; text-align: center; text-transform: uppercase; color: ${cores.destaque}; background-color: ${cores.tituloFundo}; padding: ${modoImpressao ? '5px' : '8px'}; border: 1px solid ${cores.borda};">
                    RELATÓRIO DETALHADO DE VENDAS E ATIVAÇÕES
                </div>
                <p style="margin: ${modoImpressao ? '4px 0' : '8px 0'}; color: ${cores.destaque};"><strong>${funcionario ? 'Funcionário' : 'Vendedor'}:</strong> ${escaparHTML(dadosExportacao.vendedor || '')}</p>
                <div style="font-size: ${modoImpressao ? '14px' : '10.5px'}; text-align: center; margin: ${modoImpressao ? '6px 0 3px' : '12px 0 6px'}; font-weight: bold; text-transform: uppercase; color: ${cores.destaque}; background-color: ${cores.tituloFundo}; padding: ${modoImpressao ? '4px' : '5px'}; border: 1px solid ${cores.borda}; page-break-after: avoid; break-after: avoid;">
                    Vendas e ativações
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: ${modoImpressao ? '4px' : '8px'}; font-size: ${fonteTabela}; table-layout: fixed;">
                    <thead>
                        <tr style="border-top: 1px solid ${cores.borda}; border-bottom: 1px solid ${cores.borda}; background-color: ${cores.tituloFundo}; color: ${cores.texto}; font-weight: bold;">
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: center; width: 8%;">ID</th>
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: left; width: 34%;">Cliente</th>
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: center; width: 10%;">ID Cont.</th>
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: left; width: 30%;">Plano / Contrato</th>
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: center; width: 10%;">Ativação</th>
                                    <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: right; width: 8%;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vendas.length ? vendas.map(v => `
                            <tr style="page-break-inside: avoid; break-inside: avoid;">
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: center;">${escaparHTML(v.id || v.codigo || v.id_venda || '-')}</td>
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: left; word-break: break-word;">${escaparHTML(v.cliente || v.razao_social || v.nome_cliente || 'Não identificado')}</td>
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: center;">${escaparHTML(v.contratoId || v.id_contrato || v.contrato || '-')}</td>
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: left; word-break: break-word;">${escaparHTML(v.plano || v.nome_plano || v.descricao_contrato || '-')}</td>
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: center;">${escaparHTML(v.dataAtivacao || v.data_ativacao || v.data || '-')}</td>
                                <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: right;">${formatarMoeda(v.valor)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="6" style="text-align: center; color: ${modoImpressao ? '#000000' : '#9c8e85'}; padding: 10px;">
                                    Nenhum registro de venda detalhado foi encontrado neste documento.
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </section>

            <section style="${modoImpressao ? 'page-break-before: always; break-before: page;' : ''}">
                <div style="font-size: ${modoImpressao ? '14px' : '13px'}; text-align: center; margin: ${modoImpressao ? '8px 0 4px' : '0 0 12px'}; font-weight: bold; text-transform: uppercase; color: ${cores.destaque}; background-color: ${cores.tituloFundo}; padding: ${modoImpressao ? '4px' : '8px'}; border: 1px solid ${cores.borda}; page-break-after: avoid; break-after: avoid;">
                    Relatório detalhado de upgrades
                </div>
                ${upgrades.length ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: ${fonteTabela}; table-layout: fixed;">
                        <thead>
                            <tr style="border-top: 1px solid ${cores.borda}; border-bottom: 1px solid ${cores.borda}; background-color: ${cores.tituloFundo}; color: ${cores.texto}; font-weight: bold;">
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: center; width: 12%;">Contrato</th>
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: center; width: 15%;">Data Alt.</th>
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: left; width: 15%;">Tipo Alt.</th>
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: right; width: 18%;">Valor Anterior</th>
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: right; width: 18%;">Valor Novo</th>
                                <th style="padding: ${modoImpressao ? '3px 3px' : '6px 4px'}; text-align: right; width: 22%;">Diferença</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${upgrades.map(u => `
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: center;">${escaparHTML(u.contrato || u.id_contrato || '-')}</td>
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: center;">${escaparHTML(u.data || u.data_alteracao || '-')}</td>
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: left;">${escaparHTML(u.tipo || u.tipo_alteracao || 'Upgrade')}</td>
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: right;">${formatarMoeda(u.valorAnterior ?? u.valor_antigo)}</td>
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: right;">${formatarMoeda(u.valorNovo ?? u.valor_atual)}</td>
                                    <td style="padding: ${modoImpressao ? '2px 3px' : '5px 4px'}; text-align: right;">${formatarMoeda(u.diferenca)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <p style="margin: 12px 0; color: ${cores.texto};">Nenhum upgrade foi identificado neste período.</p>
                `}
            </section>

            <section style="${quebraAntesResumo ? 'page-break-before: always; break-before: page;' : ''}">
                <div style="font-size: ${modoImpressao ? '14px' : '13px'}; text-align: center; margin: ${modoImpressao ? '8px 0 4px' : '0 0 12px'}; font-weight: bold; text-transform: uppercase; color: ${cores.destaque}; background-color: ${cores.tituloFundo}; padding: ${modoImpressao ? '4px' : '8px'}; border: 1px solid ${cores.borda}; page-break-after: avoid; break-after: avoid;">
                    Resumo e assinatura
                </div>
                <div style="display: flex; justify-content: space-between; gap: 18px; margin: ${modoImpressao ? '4px 0 8px' : '10px 0 16px'}; font-size: ${fonteBase};">
                    <strong>Total de Ativações: ${resumo.totalAtivacoes || 0}</strong>
                    <strong>Valor Total de Vendas: ${formatarMoeda(resumo.totalValorVendas)}</strong>
                    <strong>Total de Upgrades: ${upgrades.length}</strong>
                    <strong>Diferença Total: ${formatarMoeda(resumo.totalUpgrades)}</strong>
                </div>
                <div style="border: 1.5px solid ${cores.borda}; background-color: ${cores.fundoSuave}; padding: ${modoImpressao ? '8px 10px' : '14px 16px'}; page-break-inside: avoid; break-inside: avoid;">
                    <div style="font-size: ${modoImpressao ? '14px' : '10.5px'}; font-weight: bold; color: ${cores.destaque}; margin-bottom: 6px; border-bottom: 1px solid ${cores.borda}; padding-bottom: 4px; text-transform: uppercase;">
                        Resumo da Comissão Apurada
                    </div>
                    <table style="width: 100%; font-size: ${fonteBase}; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; vertical-align: top;">
                                <p style="margin: 4px 0;"><strong>${funcionario ? 'Meta Fixa (100%)' : 'Meta Padrão (100%)'}:</strong> ${resumo.metaAtivacoes || 0} ${funcionario ? 'vendas' : 'ativações'}</p>
                                <p style="margin: 4px 0;"><strong>${funcionario ? 'Meta Atingida Informada' : 'Ativações Realizadas'}:</strong> ${funcionario ? `${resumo.metaAtingidaFuncionario || 0} vendas` : `${resumo.totalAtivacoes || 0} contratos`}</p>
                                <p style="margin: 4px 0;"><strong>Percentual de Alcance:</strong> ${resumo.percentualAlcance || 0}%</p>
                            </td>
                            <td style="width: 50%; vertical-align: top; text-align: right;">
                                ${funcionario
                                    ? `<p style="margin: 4px 0;"><strong>Comissão por venda:</strong> ${formatarMoeda(resumo.valorPorVenda)}</p>
                                       <p style="margin: 4px 0;"><strong>Vendas consideradas:</strong> ${resumo.vendasComissionaveis || 0}</p>`
                                    : `<p style="margin: 4px 0;"><strong>Faixa Aplicada:</strong> ${resumo.porcentagemUtilizada || 0}% de comissão</p>`}
                                <p style="margin: 4px 0;"><strong>Comissão Vendas:</strong> ${formatarMoeda(resumo.comissaoVendas)}</p>
                                <p style="margin: 4px 0;"><strong>Comissão Upgrades:</strong> ${formatarMoeda(resumo.totalUpgrades)}</p>
                            </td>
                        </tr>
                    </table>
                    <div style="background-color: ${cores.fundo}; padding: 8px 10px; font-size: ${modoImpressao ? '16px' : '10.5px'}; font-weight: bold; text-align: right; color: ${cores.destaque}; margin-top: 10px; border: 1px solid ${cores.borda};">
                        VALOR TOTAL A RECEBER: ${formatarMoeda(resumo.comissaoTotal)}
                    </div>
                </div>
                ${assinaturaHTML}
            </section>
        </div>
    `;
}
