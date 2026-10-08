// js/previewModal.js

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