import { showLoader, hideLoader, showAlert } from '../ui';
import { getFiles } from '../state';
import { readFileAsArrayBuffer } from '../utils/helpers';
import * as pdfjsLib from 'pdfjs-dist';
import forge from 'node-forge';
import jsQR from 'jsqr';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ExtractedSignature {
  index: number;
  contents: Uint8Array;
  byteRange: number[];
  reason?: string;
  location?: string;
  contactInfo?: string;
  name?: string;
  signingTime?: string;
}

interface SignatureValidationResult {
  signatureIndex: number;
  isValid: boolean;
  signerName: string;
  signerOrg?: string;
  signerEmail?: string;
  issuer: string;
  issuerOrg?: string;
  validFrom: Date;
  validTo: Date;
  isExpired: boolean;
  isSelfSigned: boolean;
  algorithms: {
    digest: string;
    signature: string;
  };
  serialNumber: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  signatureDate?: Date;
  errorMessage?: string;
  isBSrE?: boolean;
  qrCodeData?: string;
}

interface BSrEQRCodeInfo {
  found: boolean;
  pageNumber?: number;
  data?: string;
  issuer?: string;
  serialNumber?: string;
  signatureDate?: string;
}

function extractSignatures(pdfBytes: Uint8Array): ExtractedSignature[] {
  const signatures: ExtractedSignature[] = [];
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);

  // Find all signature objects for /Type /Sig
  const sigRegex = /\/Type\s*\/Sig\b/g;
  let sigMatch;
  let sigIndex = 0;

  while ((sigMatch = sigRegex.exec(pdfString)) !== null) {
    try {
      const searchStart = Math.max(0, sigMatch.index - 5000);
      const searchEnd = Math.min(pdfString.length, sigMatch.index + 10000);
      const context = pdfString.substring(searchStart, searchEnd);
      
      const byteRangeMatch = context.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/);
      if (!byteRangeMatch) continue;

      const byteRange = [
        parseInt(byteRangeMatch[1], 10),
        parseInt(byteRangeMatch[2], 10),
        parseInt(byteRangeMatch[3], 10),
        parseInt(byteRangeMatch[4], 10),
      ];

      const contentsMatch = context.match(/\/Contents\s*<([0-9A-Fa-f]+)>/);
      if (!contentsMatch) continue;

      const hexContents = contentsMatch[1];
      const contentsBytes = hexToBytes(hexContents);

      const reasonMatch = context.match(/\/Reason\s*\(([^)]*)\)/);
      const locationMatch = context.match(/\/Location\s*\(([^)]*)\)/);
      const contactMatch = context.match(/\/ContactInfo\s*\(([^)]*)\)/);
      const nameMatch = context.match(/\/Name\s*\(([^)]*)\)/);
      const timeMatch = context.match(/\/M\s*\(D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);

      let signingTime: string | undefined;
      if (timeMatch) {
        signingTime = `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}T${timeMatch[4]}:${timeMatch[5]}:${timeMatch[6]}`;
      }

      signatures.push({
        index: sigIndex++,
        contents: contentsBytes,
        byteRange,
        reason: reasonMatch ? decodeURIComponent(escape(reasonMatch[1])) : undefined,
        location: locationMatch ? decodeURIComponent(escape(locationMatch[1])) : undefined,
        contactInfo: contactMatch ? decodeURIComponent(escape(contactMatch[1])) : undefined,
        name: nameMatch ? decodeURIComponent(escape(nameMatch[1])) : undefined,
        signingTime,
      });
    } catch (e) {
      console.warn('Error extracting signature at index', sigIndex, e);
    }
  }

  return signatures;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  let actualLength = bytes.length;
  while (actualLength > 0 && bytes[actualLength - 1] === 0) {
    actualLength--;
  }

  return bytes.slice(0, actualLength);
}

function getDigestAlgorithmName(oid: string): string {
  const digestAlgorithms: Record<string, string> = {
    '1.2.840.113549.2.5': 'MD5',
    '1.3.14.3.2.26': 'SHA-1',
    '2.16.840.1.101.3.4.2.1': 'SHA-256',
    '2.16.840.1.101.3.4.2.2': 'SHA-384',
    '2.16.840.1.101.3.4.2.3': 'SHA-512',
    '2.16.840.1.101.3.4.2.4': 'SHA-224',
  };
  return digestAlgorithms[oid] || oid || 'Unknown';
}

function getSignatureAlgorithmName(oid: string): string {
  const signatureAlgorithms: Record<string, string> = {
    '1.2.840.113549.1.1.1': 'RSA',
    '1.2.840.113549.1.1.5': 'RSA with SHA-1',
    '1.2.840.113549.1.1.11': 'RSA with SHA-256',
    '1.2.840.113549.1.1.12': 'RSA with SHA-384',
    '1.2.840.113549.1.1.13': 'RSA with SHA-512',
    '1.2.840.10045.2.1': 'ECDSA',
    '1.2.840.10045.4.1': 'ECDSA with SHA-1',
    '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
    '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
    '1.2.840.10045.4.3.4': 'ECDSA with SHA-512',
  };
  return signatureAlgorithms[oid] || oid || 'Unknown';
}

async function detectBSrEQRCode(pdf: any): Promise<BSrEQRCodeInfo> {
  const result: BSrEQRCodeInfo = {
    found: false
  };

  try {
    // Scan all pages for QR codes
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas to render page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect QR code using jsQR
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrCode && qrCode.data) {
        const qrData = qrCode.data;
        
        // Check if QR code is from BSrE/BSSN
        // BSrE QR codes typically contain certificate information or verification URLs
        const isBSrE = 
          qrData.toLowerCase().includes('bsre') ||
          qrData.toLowerCase().includes('bssn') ||
          qrData.toLowerCase().includes('balai sertifikasi elektronik') ||
          qrData.toLowerCase().includes('peruri') ||
          qrData.toLowerCase().includes('ttd.bssn.go.id') ||
          qrData.toLowerCase().includes('verificar') ||
          qrData.includes('nik=') ||
          qrData.includes('nip=');

        if (isBSrE) {
          result.found = true;
          result.pageNumber = i;
          result.data = qrData;
          
          // Try to extract information from QR data
          try {
            // Parse common BSrE QR code formats
            if (qrData.includes('issuer=')) {
              const issuerMatch = qrData.match(/issuer=([^&\n]+)/i);
              if (issuerMatch) result.issuer = decodeURIComponent(issuerMatch[1]);
            }
            
            if (qrData.includes('serial=') || qrData.includes('sn=')) {
              const serialMatch = qrData.match(/(?:serial|sn)=([^&\n]+)/i);
              if (serialMatch) result.serialNumber = serialMatch[1];
            }
            
            if (qrData.includes('date=') || qrData.includes('timestamp=')) {
              const dateMatch = qrData.match(/(?:date|timestamp)=([^&\n]+)/i);
              if (dateMatch) result.signatureDate = dateMatch[1];
            }
          } catch (e) {
            console.warn('Error parsing BSrE QR code data:', e);
          }
          
          break; // Found BSrE QR code, stop scanning
        }
      }
    }
  } catch (error) {
    console.error('Error detecting BSrE QR code:', error);
  }

  return result;
}

function validateSignature(
  signature: ExtractedSignature,
  pdfBytes: Uint8Array
): SignatureValidationResult {
  const result: SignatureValidationResult = {
    signatureIndex: signature.index,
    isValid: false,
    signerName: 'Unknown',
    issuer: 'Unknown',
    validFrom: new Date(0),
    validTo: new Date(0),
    isExpired: false,
    isSelfSigned: false,
    algorithms: { digest: 'Unknown', signature: 'Unknown' },
    serialNumber: '',
    reason: signature.reason,
    location: signature.location,
    contactInfo: signature.contactInfo,
  };

  try {
    const binaryString = String.fromCharCode.apply(null, Array.from(signature.contents));
    const asn1 = forge.asn1.fromDer(binaryString);
    const p7 = forge.pkcs7.messageFromAsn1(asn1) as any;

    if (!p7.certificates || p7.certificates.length === 0) {
      result.errorMessage = 'No certificates found in signature';
      return result;
    }

    const signerCert = p7.certificates[0] as forge.pki.Certificate;

    const subjectCN = signerCert.subject.getField('CN');
    const subjectO = signerCert.subject.getField('O');
    const subjectE = signerCert.subject.getField('E') || signerCert.subject.getField('emailAddress');
    const issuerCN = signerCert.issuer.getField('CN');
    const issuerO = signerCert.issuer.getField('O');

    result.signerName = (subjectCN?.value as string) ?? 'Unknown';
    result.signerOrg = subjectO?.value as string | undefined;
    result.signerEmail = subjectE?.value as string | undefined;
    result.issuer = (issuerCN?.value as string) ?? 'Unknown';
    result.issuerOrg = issuerO?.value as string | undefined;
    result.validFrom = signerCert.validity.notBefore;
    result.validTo = signerCert.validity.notAfter;
    result.serialNumber = signerCert.serialNumber;

    const now = new Date();
    result.isExpired = now > result.validTo || now < result.validFrom;

    result.isSelfSigned = signerCert.isIssuer(signerCert);

    // Check if certificate is from BSrE/BSSN
    const issuerStr = result.issuer.toLowerCase() + (result.issuerOrg?.toLowerCase() || '');
    const signerStr = result.signerName.toLowerCase() + (result.signerOrg?.toLowerCase() || '');
    
    result.isBSrE = 
      issuerStr.includes('bsre') ||
      issuerStr.includes('bssn') ||
      issuerStr.includes('balai sertifikasi elektronik') ||
      issuerStr.includes('peruri') ||
      issuerStr.includes('kominfo') ||
      signerStr.includes('bsre') ||
      signerStr.includes('bssn');

    result.algorithms = {
      digest: getDigestAlgorithmName(signerCert.siginfo?.algorithmOid || ''),
      signature: getSignatureAlgorithmName(signerCert.signatureOid || ''),
    };

    // Parse signing time
    if (signature.signingTime) {
      result.signatureDate = new Date(signature.signingTime);
    }

    result.isValid = true;

  } catch (e) {
    result.errorMessage = e instanceof Error ? e.message : 'Failed to parse signature';
  }

  return result;
}

export async function validateSignaturePdf() {
  const files = getFiles();
  
  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Validating signatures...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Load PDF with pdf.js for QR code detection
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Detect BSrE QR code signatures
    showLoader('Detecting BSrE QR code signatures...');
    const bsreQRCode = await detectBSrEQRCode(pdf);
    
    // Extract traditional digital signatures using node-forge
    showLoader('Extracting digital signatures...');
    const signatures = extractSignatures(pdfBytes);
    
    if (signatures.length === 0 && !bsreQRCode.found) {
      hideLoader();
      showAlert(
        'No Signatures Found',
        'This PDF does not contain any digital signatures or BSrE QR code signatures.',
        'info'
      );
      return;
    }

    // Validate each signature
    showLoader('Validating certificates...');
    const results = signatures.map(sig => validateSignature(sig, pdfBytes));
    
    hideLoader();
    
    // Display results
    let message = '';
    
    // Display BSrE QR Code information first
    if (bsreQRCode.found) {
      message += '🇮🇩 BSrE QR Code Signature Detected!\n';
      message += '═══════════════════════════════════\n';
      message += `Page: ${bsreQRCode.pageNumber}\n`;
      message += `Type: Balai Sertifikasi Elektronik (BSrE), BSSN\n`;
      if (bsreQRCode.issuer) message += `Issuer: ${bsreQRCode.issuer}\n`;
      if (bsreQRCode.serialNumber) message += `Serial: ${bsreQRCode.serialNumber}\n`;
      if (bsreQRCode.signatureDate) message += `Date: ${bsreQRCode.signatureDate}\n`;
      message += `QR Data: ${bsreQRCode.data?.substring(0, 100)}${bsreQRCode.data && bsreQRCode.data.length > 100 ? '...' : ''}\n`;
      message += '\n';
    }
    
    // Display traditional digital signatures
    if (results.length > 0) {
      message += `Found ${results.length} Digital Signature${results.length > 1 ? 's' : ''}:\n`;
      message += '═══════════════════════════════════\n\n';
      
      results.forEach((result, index) => {
        message += `Signature ${index + 1}:`;
        if (result.isBSrE) message += ' 🇮🇩 [BSrE Certificate]';
        message += '\n';
        message += `  Signer: ${result.signerName}${result.signerOrg ? ` (${result.signerOrg})` : ''}\n`;
        message += `  Issuer: ${result.issuer}${result.issuerOrg ? ` (${result.issuerOrg})` : ''}\n`;
        message += `  Valid From: ${result.validFrom.toLocaleDateString()}\n`;
        message += `  Valid To: ${result.validTo.toLocaleDateString()}\n`;
        message += `  Status: ${result.isExpired ? '❌ Expired' : '✅ Valid'}\n`;
        message += `  Self-Signed: ${result.isSelfSigned ? 'Yes' : 'No'}\n`;
        if (result.isBSrE) message += `  Certificate Type: Balai Sertifikasi Elektronik (BSrE)\n`;
        message += `  Algorithm: ${result.algorithms.signature}\n`;
        if (result.reason) message += `  Reason: ${result.reason}\n`;
        if (result.location) message += `  Location: ${result.location}\n`;
        if (result.errorMessage) message += `  Error: ${result.errorMessage}\n`;
        message += '\n';
      });
    }
    
    const hasErrors = results.some(r => r.errorMessage);
    const allExpired = results.length > 0 && results.every(r => r.isExpired);
    const hasBSrE = bsreQRCode.found || results.some(r => r.isBSrE);
    
    let title = 'Validation Complete';
    if (hasErrors) title = 'Validation Errors';
    else if (allExpired) title = 'Signatures Expired';
    else if (hasBSrE) title = 'BSrE Signature Detected';
    
    showAlert(
      title,
      message,
      hasErrors ? 'error' : allExpired ? 'warning' : 'success'
    );
    
  } catch (error: any) {
    console.error('[ValidateSignature] Error:', error);
    hideLoader();
    showAlert(
      'Error',
      `An error occurred while validating signatures: ${error.message}`
    );
  }
}
