export function getSelectedQuality(): number {
  // Default quality setting - could be made configurable
  return 0.8;
}

export async function compressImageFile(file: File, quality: number): Promise<File> {
  // Simple stub - in a real implementation, this would compress the image
  // For now, just return the original file
  return file;
}