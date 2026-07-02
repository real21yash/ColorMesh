/**
 * Color utility functions for the Color Extractor
 */

export interface ColorSample {
  hex: string;
  rgb: string;
  r: number;
  g: number;
  b: number;
}

/** Image MIME types accepted for upload / drag-and-drop */
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/avif',
];

/** File extensions accepted by the hidden <input accept> attribute */
export const ACCEPTED_IMAGE_EXTENSIONS =
  '.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif';

export function isAcceptedImageFile(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return true;
  // Fall back to extension check for files with empty/odd MIME types
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(file.name);
}

/** Returns ideal readable text color (black/white) for a given background */
export function getContrastTextColor(r: number, g: number, b: number): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

/**
 * Convert RGB values to HEX format
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

/**
 * Convert RGB values to RGB string format
 */
export function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get dominant color from an image canvas in a specific cell using k-means clustering
 */
export function getDominantColor(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  width: number,
  height: number
): ColorSample {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const imageData = ctx.getImageData(startX, startY, width, height);
  const data = imageData.data;

  // Downsample: extract every 5th pixel (i += 20 instead of i += 4)
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 20) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  if (pixels.length === 0) {
    return {
      hex: '#000000',
      rgb: 'rgb(0, 0, 0)',
      r: 0,
      g: 0,
      b: 0,
    };
  }

  // K-means clustering with k=3
  const k = 3;
  const maxIterations = 10;

  // Initialize centroids randomly from pixels
  const centroids: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    centroids.push([...pixels[randomIndex]]);
  }

  // Run k-means iterations
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign pixels to nearest centroid
    const assignments: number[] = new Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
      let minDistance = Infinity;
      let nearestCentroid = 0;

      for (let j = 0; j < k; j++) {
        const distance =
          Math.pow(pixels[i][0] - centroids[j][0], 2) +
          Math.pow(pixels[i][1] - centroids[j][1], 2) +
          Math.pow(pixels[i][2] - centroids[j][2], 2);

        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = j;
        }
      }

      assignments[i] = nearestCentroid;
    }

    // Update centroids
    const counts = new Array(k).fill(0);
    const sums: [number, number, number][] = Array(k)
      .fill(null)
      .map(() => [0, 0, 0]);

    for (let i = 0; i < pixels.length; i++) {
      const cluster = assignments[i];
      counts[cluster]++;
      sums[cluster][0] += pixels[i][0];
      sums[cluster][1] += pixels[i][1];
      sums[cluster][2] += pixels[i][2];
    }

    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        centroids[j] = [
          Math.round(sums[j][0] / counts[j]),
          Math.round(sums[j][1] / counts[j]),
          Math.round(sums[j][2] / counts[j]),
        ];
      }
    }
  }

  // Count pixels in each cluster to find dominant one
  const clusterCounts = new Array(k).fill(0);
  for (let i = 0; i < pixels.length; i++) {
    let minDistance = Infinity;
    let nearestCentroid = 0;

    for (let j = 0; j < k; j++) {
      const distance =
        Math.pow(pixels[i][0] - centroids[j][0], 2) +
        Math.pow(pixels[i][1] - centroids[j][1], 2) +
        Math.pow(pixels[i][2] - centroids[j][2], 2);

      if (distance < minDistance) {
        minDistance = distance;
        nearestCentroid = j;
      }
    }

    clusterCounts[nearestCentroid]++;
  }

  // Get cluster with highest count
  let dominantCluster = 0;
  let maxCount = 0;
  for (let i = 0; i < k; i++) {
    if (clusterCounts[i] > maxCount) {
      maxCount = clusterCounts[i];
      dominantCluster = i;
    }
  }

  const [r, g, b] = centroids[dominantCluster];

  return {
    hex: rgbToHex(r, g, b),
    rgb: rgbToString(r, g, b),
    r,
    g,
    b,
  };
}

/**
 * Export colors as JSON
 */
export function exportAsJSON(colors: ColorSample[][]): string {
  const formattedColors = colors.map((row) =>
    row.map((color) => ({
      hex: color.hex,
      rgb: color.rgb,
    }))
  );
  return JSON.stringify(formattedColors, null, 2);
}

/**
 * Export colors as CSV
 */
export function exportAsCSV(colors: ColorSample[][]): string {
  let csv = 'Row,Column,HEX,RGB\n';
  colors.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      csv += `${rowIndex + 1},${colIndex + 1},${color.hex},${color.rgb}\n`;
    });
  });
  return csv;
}

/**
 * Backward compatibility: alias getDominantColor as getAverageColor
 */
export const getAverageColor = getDominantColor;

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
