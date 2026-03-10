import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, formatBytes, readFileAsArrayBuffer } from '../utils/helpers';
import { PDFDocument } from 'pdf-lib';
import { icons, createIcons } from 'lucide';
import JSZip from 'jszip';
import { getFiles } from '../state';

function flattenFormsInDoc(pdfDoc: PDFDocument) {
    const form = pdfDoc.getForm();
    form.flatten();
}

// Main function to flatten PDF - exported for use in App.tsx
export async function flattenPdf(): Promise<boolean> {
    const stateFiles = getFiles();

    if (stateFiles.length === 0) {
        showAlert('No Files', 'Please upload a PDF file first.');
        return false;
    }

    showLoader('Flattening PDF...');

    try {
        const total = stateFiles.length;
        let completed = 0;
        let failed = 0;

        if (total === 1) {
            const file = stateFiles[0];
            showLoader(`Flattening ${file.name}...`);

            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(arrayBuffer as ArrayBuffer, { ignoreEncryption: true });

            try {
                flattenFormsInDoc(pdfDoc);
            } catch (e: any) {
                if (!e.message.includes('getForm')) {
                    throw e;
                }
            }

            const newPdfBytes = await pdfDoc.save();
            downloadFile(
                new Blob([newPdfBytes], { type: 'application/pdf' }),
                `flattened_${file.name}`
            );

            hideLoader();
            showAlert('Flatten Complete', 'PDF forms and annotations have been flattened.', 'success');
            return true;
        } else {
            // Multiple files - create ZIP
            const zip = new JSZip();

            for (const file of stateFiles) {
                try {
                    showLoader(`Flattening ${file.name} (${completed + 1}/${total})...`);

                    const arrayBuffer = await readFileAsArrayBuffer(file);
                    const pdfDoc = await PDFDocument.load(arrayBuffer as ArrayBuffer, { ignoreEncryption: true });

                    try {
                        flattenFormsInDoc(pdfDoc);
                    } catch (e: any) {
                        if (!e.message.includes('getForm')) {
                            throw e;
                        }
                    }

                    const flattenedBytes = await pdfDoc.save();
                    zip.file(`flattened_${file.name}`, flattenedBytes);
                    completed++;
                } catch (error) {
                    console.error(`Failed to flatten ${file.name}:`, error);
                    failed++;
                }
            }

            showLoader('Creating ZIP archive...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            downloadFile(zipBlob, 'flattened_pdfs.zip');

            hideLoader();

            if (failed === 0) {
                showAlert(
                    'Flatten Complete',
                    `Successfully flattened ${completed} PDF(s).`,
                    'success'
                );
            } else {
                showAlert(
                    'Flatten Partial',
                    `Flattened ${completed} PDF(s), failed ${failed}.`,
                    'warning'
                );
            }
            return true;
        }
    } catch (e: any) {
        hideLoader();
        showAlert('Error', `An error occurred during flattening. Error: ${e.message}`);
        return false;
    }
}
