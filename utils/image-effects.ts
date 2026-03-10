// Image effects utilities for PDF processing

export interface ColorAdjustments {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
}

export function applyColorAdjustments(
  imageData: ImageData,
  adjustments: ColorAdjustments
): ImageData {
  const data = imageData.data;
  const { brightness = 0, contrast = 0, saturation = 0, hue = 0 } = adjustments;

  // Convert adjustment values to usable ranges
  const brightnessFactor = brightness / 100;
  const contrastFactor = (contrast + 100) / 100;
  const saturationFactor = (saturation + 100) / 100;
  const hueShift = (hue * Math.PI) / 180;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    if (brightness !== 0) {
      r += brightnessFactor * 255;
      g += brightnessFactor * 255;
      b += brightnessFactor * 255;
    }

    // Apply contrast
    if (contrast !== 0) {
      r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;
    }

    // Apply saturation and hue
    if (saturation !== 0 || hue !== 0) {
      // Convert RGB to HSL
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;

      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case rNorm:
            h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
            break;
          case gNorm:
            h = ((bNorm - rNorm) / d + 2) / 6;
            break;
          case bNorm:
            h = ((rNorm - gNorm) / d + 4) / 6;
            break;
        }
      }

      // Apply adjustments
      h = (h + hueShift / (2 * Math.PI)) % 1;
      s = Math.max(0, Math.min(1, s * saturationFactor));

      // Convert back to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      if (s === 0) {
        r = g = b = l * 255;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3) * 255;
        g = hue2rgb(p, q, h) * 255;
        b = hue2rgb(p, q, h - 1 / 3) * 255;
      }
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return imageData;
}

export function invertColors(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
    // Alpha channel (data[i + 3]) remains unchanged
  }

  return imageData;
}

export function toGreyscale(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = grey; // Red
    data[i + 1] = grey; // Green
    data[i + 2] = grey; // Blue
    // Alpha channel (data[i + 3]) remains unchanged
  }

  return imageData;
}

export function applyScannerEffect(
  imageData: ImageData,
  options: {
    brightness?: number;
    contrast?: number;
    sharpen?: boolean;
  } = {}
): ImageData {
  const { brightness = 10, contrast = 20, sharpen = true } = options;

  // Apply brightness and contrast
  let result = applyColorAdjustments(imageData, { brightness, contrast });

  // Apply sharpening if requested
  if (sharpen) {
    result = sharpenImage(result);
  }

  return result;
}

function sharpenImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  // Sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const outputIdx = (y * width + x) * 4 + c;
        output.data[outputIdx] = Math.max(0, Math.min(255, sum));
      }
      // Copy alpha channel
      const idx = (y * width + x) * 4;
      output.data[idx + 3] = data[idx + 3];
    }
  }

  // Copy edges from original
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 4; c++) {
      output.data[x * 4 + c] = data[x * 4 + c];
      output.data[((height - 1) * width + x) * 4 + c] =
        data[((height - 1) * width + x) * 4 + c];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 4; c++) {
      output.data[y * width * 4 + c] = data[y * width * 4 + c];
      output.data[(y * width + width - 1) * 4 + c] =
        data[(y * width + width - 1) * 4 + c];
    }
  }

  return output;
}
