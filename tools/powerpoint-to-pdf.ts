import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { getLibreOfficeConverter, type LoadProgress } from '../utils/libreoffice-loader';

const POWERPOINT_EXTENSION_REGEX = /\.(ppt|pptx|odp)$/i;

function toPdfFileName(name: string): string {
  return name.replace(POWERPOINT_EXTENSION_REGEX, '') + '.pdf';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export async function powerpointToPdf(filesOverride?: File[]) {
  const files = filesOverride && filesOverride.length > 0 ? filesOverride : getFiles();

  if (files.length === 0) {
    showAlert('No Files', 'Please select at least one PowerPoint file.');
    return;
  }

  const hasUnsupportedFile = files.some((file) => !POWERPOINT_EXTENSION_REGEX.test(file.name));
  if (hasUnsupportedFile) {
    showAlert('Invalid File Type', 'Please upload only .ppt, .pptx, or .odp files.', 'error');
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

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      showLoader(`Converting ${index + 1}/${files.length}: ${file.name}...`);

      const pdfBlob = await converter.convertToPdf(file);
      const pdfBuffer = await pdfBlob.arrayBuffer();
      zip.file(toPdfFileName(file.name), pdfBuffer);
    }

    showLoader('Preparing ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    downloadFile(zipBlob, 'powerpoint-converted.zip');
    hideLoader();
    showAlert(
      'Conversion Complete',
      `Successfully converted ${files.length} PowerPoint file(s) to PDF.`,
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

export async function setupPowerpointToPdfTool() {
  const container = document.getElementById('powerpoint-to-pdf-container');
  if (!container) return;

  container.classList.remove('hidden');

  const convertBtn = document.getElementById('powerpoint-to-pdf-process-btn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      void powerpointToPdf();
    };
  }
}
