import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, formatBytes, hexToRgb } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument, rgb, PageSizes } from 'pdf-lib';
import { state } from '../state';

let pdfDoc: PDFLibDocument | null = null;

function resetState() {
    pdfDoc = null;

    const fileDisplayArea = document.getElementById('n-up-file-display-area');
    if (fileDisplayArea) fileDisplayArea.innerHTML = '';

    const toolOptions = document.getElementById('n-up-tool-options');
    if (toolOptions) toolOptions.classList.add('hidden');
}

async function updateUI() {
    const fileDisplayArea = document.getElementById('n-up-file-display-area');
    const toolOptions = document.getElementById('n-up-tool-options');

    if (!fileDisplayArea) return;

    fileDisplayArea.innerHTML = '';

    if (state.files.length > 0) {
        const file = state.files[0];
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

        const infoContainer = document.createElement('div');
        infoContainer.className = 'flex flex-col overflow-hidden';

        const nameSpan = document.createElement('div');
        nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
        nameSpan.textContent = file.name;

        const metaSpan = document.createElement('div');
        metaSpan.className = 'text-xs text-gray-400';
        metaSpan.textContent = `${formatBytes(file.size)} • Loading...`;

        infoContainer.append(nameSpan, metaSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
        removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
        removeBtn.onclick = function () {
            state.files = [];
            resetState();
        };

        fileDiv.append(infoContainer, removeBtn);
        fileDisplayArea.appendChild(fileDiv);
        createIcons({ icons });

        try {
            showLoader('Loading PDF...');
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await PDFLibDocument.load(arrayBuffer, {
                ignoreEncryption: true,
                throwOnInvalidObject: false
            });
            hideLoader();

            const pageCount = pdfDoc.getPageCount();
            metaSpan.textContent = `${formatBytes(file.size)} • ${pageCount} pages`;

            if (toolOptions) {
                toolOptions.classList.remove('hidden');
                setupButtonListeners();
            }
        } catch (error) {
            console.error('Error loading PDF:', error);
            hideLoader();
            showAlert('Error', 'Failed to load PDF file.');
            resetState();
        }
    } else {
        if (toolOptions) toolOptions.classList.add('hidden');
    }
}

function setupButtonListeners() {
    const processBtn = document.getElementById('n-up-process-btn');
    const addBorderCheckbox = document.getElementById('n-up-add-border');
    const borderColorWrapper = document.getElementById('n-up-border-color-wrapper');

    if (addBorderCheckbox && borderColorWrapper) {
        addBorderCheckbox.addEventListener('change', function () {
            borderColorWrapper.classList.toggle('hidden', !(addBorderCheckbox as HTMLInputElement).checked);
        });
    }

    if (processBtn) {
        processBtn.onclick = () => nUpTool();
    }
}

async function nUpTool() {
    if (!pdfDoc || state.files.length === 0) {
        showAlert('Error', 'Please upload a PDF first.');
        return;
    }

    const n = parseInt((document.getElementById('n-up-pages-per-sheet') as HTMLSelectElement).value);
    const pageSizeKey = (document.getElementById('n-up-output-page-size') as HTMLSelectElement).value as keyof typeof PageSizes;
    let orientation = (document.getElementById('n-up-output-orientation') as HTMLSelectElement).value;
    const useMargins = (document.getElementById('n-up-add-margins') as HTMLInputElement).checked;
    const addBorder = (document.getElementById('n-up-add-border') as HTMLInputElement).checked;
    const borderColor = hexToRgb((document.getElementById('n-up-border-color') as HTMLInputElement).value);

    showLoader('Creating N-Up PDF...');

    try {
        const sourceDoc = pdfDoc;
        const newDoc = await PDFLibDocument.create();
        const sourcePages = sourceDoc.getPages();

        const gridDims: Record<number, [number, number]> = { 2: [2, 1], 4: [2, 2], 9: [3, 3], 16: [4, 4] };
        const dims = gridDims[n];

        let [pageWidth, pageHeight] = PageSizes[pageSizeKey];

        if (orientation === 'auto') {
            const firstPage = sourcePages[0];
            const isSourceLandscape = firstPage.getWidth() > firstPage.getHeight();
            orientation = isSourceLandscape && dims[0] > dims[1] ? 'landscape' : 'portrait';
        }

        if (orientation === 'landscape' && pageWidth < pageHeight) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }

        const margin = useMargins ? 36 : 0;
        const gutter = useMargins ? 10 : 0;

        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        for (let i = 0; i < sourcePages.length; i += n) {
            showLoader(`Processing sheet ${Math.floor(i / n) + 1}...`);
            const chunk = sourcePages.slice(i, i + n);
            const outputPage = newDoc.addPage([pageWidth, pageHeight]);

            const cellWidth = (usableWidth - gutter * (dims[0] - 1)) / dims[0];
            const cellHeight = (usableHeight - gutter * (dims[1] - 1)) / dims[1];

            for (let j = 0; j < chunk.length; j++) {
                const sourcePage = chunk[j];
                const embeddedPage = await newDoc.embedPage(sourcePage);

                const scale = Math.min(
                    cellWidth / embeddedPage.width,
                    cellHeight / embeddedPage.height
                );
                const scaledWidth = embeddedPage.width * scale;
                const scaledHeight = embeddedPage.height * scale;

                const row = Math.floor(j / dims[0]);
                const col = j % dims[0];
                const cellX = margin + col * (cellWidth + gutter);
                const cellY = pageHeight - margin - (row + 1) * cellHeight - row * gutter;

                const x = cellX + (cellWidth - scaledWidth) / 2;
                const y = cellY + (cellHeight - scaledHeight) / 2;

                outputPage.drawPage(embeddedPage, {
                    x,
                    y,
                    width: scaledWidth,
                    height: scaledHeight,
                });

                if (addBorder) {
                    outputPage.drawRectangle({
                        x,
                        y,
                        width: scaledWidth,
                        height: scaledHeight,
                        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
                        borderWidth: 1,
                    });
                }
            }
        }

        const newPdfBytes = await newDoc.save();
        const originalName = state.files[0].name.replace(/\.pdf$/i, '');

        downloadFile(
            new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
            `${originalName}_${n}-up.pdf`
        );

        showAlert('Success', 'N-Up PDF created successfully!', 'success', function () {
            resetState();
        });
    } catch (e) {
        console.error(e);
        showAlert('Error', 'An error occurred while creating the N-Up PDF.');
    } finally {
        hideLoader();
    }
}

export async function setupNUpTool() {
    console.log('[NUp] setupNUpTool called');
    
    const container = document.getElementById('n-up-container');
    console.log('[NUp] Container element:', container);
    
    if (container) {
        container.classList.remove('hidden');
        console.log('[NUp] Container shown');
    } else {
        console.error('[NUp] Container not found!');
    }
    
    if (state.files.length > 0) {
        console.log('[NUp] Loading PDF from files');
        await updateUI();
    }
}
