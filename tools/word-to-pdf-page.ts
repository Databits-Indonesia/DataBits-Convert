import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { getLibreOfficeConverter, type LoadProgress } from '../utils/libreoffice-loader';

const WORD_EXTENSION_REGEX = /\.(doc|docx|odt|rtf)$/i;

function toPdfFileName(name: string): string {
  return name.replace(WORD_EXTENSION_REGEX, '') + '.pdf';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

function hasUnsupportedWordFiles(files: File[]): boolean {
  return files.some((file) => !WORD_EXTENSION_REGEX.test(file.name));
}

function deduplicateFileName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const extensionIndex = name.lastIndexOf('.');
  const hasExtension = extensionIndex > 0;
  const baseName = hasExtension ? name.slice(0, extensionIndex) : name;
  const extension = hasExtension ? name.slice(extensionIndex) : '';

  let counter = 2;
  let candidate = `${baseName} (${counter})${extension}`;

  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${baseName} (${counter})${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

export async function wordToPdf(filesOverride?: File[]) {
  const files = filesOverride && filesOverride.length > 0 ? filesOverride : getFiles();

  if (files.length === 0) {
    showAlert('No Files', 'Please select at least one Word document.');
    return;
  }

  if (hasUnsupportedWordFiles(files)) {
    showAlert('Invalid File Type', 'Please upload only .doc, .docx, .odt, or .rtf files.', 'error');
    return;
  }

  try {
    const converter = getLibreOfficeConverter();

    showLoader('Initializing LibreOffice...');
    await converter.initialize((progress: LoadProgress) => {
      showLoader(progress.message);
    });

    if (files.length === 1) {
      const file = files[0];
      showLoader(`Converting ${file.name}...`);

      const pdfBlob = await converter.convertToPdf(file);
      downloadFile(pdfBlob, toPdfFileName(file.name));

      hideLoader();
      showAlert('Conversion Complete', `Successfully converted ${file.name} to PDF.`, 'success');
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      showLoader(`Converting ${index + 1}/${files.length}: ${file.name}...`);

      const pdfBlob = await converter.convertToPdf(file);
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const zipEntryName = deduplicateFileName(toPdfFileName(file.name), usedNames);
      zip.file(zipEntryName, pdfBuffer);
    }

    showLoader('Preparing ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    downloadFile(zipBlob, 'word-converted.zip');
    hideLoader();
    showAlert(
      'Conversion Complete',
      `Successfully converted ${files.length} Word document(s) to PDF.`,
      'success'
    );
  } catch (error) {
    hideLoader();
    showAlert(
      'Error',
      `An error occurred during conversion. Error: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

export async function setupWordToPdfTool() {
  const container = document.getElementById('word-to-pdf-container');
  if (!container) return;

  container.classList.remove('hidden');

  const convertBtn = document.getElementById('word-to-pdf-process-btn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      void wordToPdf();
    };
  }
}
