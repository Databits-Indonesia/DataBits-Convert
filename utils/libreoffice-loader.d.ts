export interface LoadProgress {
  percent: number;
  message: string;
  phase?: string;
}

export interface LibreOfficeToolConverter {
  initialize(onProgress?: (progress: LoadProgress) => void): Promise<void>;
  convertToPdf(file: File): Promise<Blob>;
  isInitialized(): boolean;
}

export function getLibreOfficeConverter(): LibreOfficeToolConverter;
