export interface ColorSample {
  hex: string;
  rgb: string;
  r: number;
  g: number;
  b: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Samples the dominant color from a region of a canvas using k-means clustering.
 */
export function sampleColor(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  width: number,
  height: number
): ColorSample {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const imageData = ctx.getImageData(startX, startY, width, height);
  const data = imageData.data;

  // Sample every 5th pixel for performance
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 20) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  if (pixels.length === 0) {
    return { hex: "#000000", rgb: "rgb(0, 0, 0)", r: 0, g: 0, b: 0 };
  }

  const k = 3;
  const maxIterations = 10;

  // Initialize centroids randomly
  const centroids: [number, number, number][] = Array.from({ length: k }, () => {
    const idx = Math.floor(Math.random() * pixels.length);
    return [...pixels[idx]] as [number, number, number];
  });

  for (let iter = 0; iter < maxIterations; iter++) {
    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);

    for (const pixel of pixels) {
      let nearest = 0;
      let minDist = Infinity;
      for (let j = 0; j < k; j++) {
        const dist =
          (pixel[0] - centroids[j][0]) ** 2 +
          (pixel[1] - centroids[j][1]) ** 2 +
          (pixel[2] - centroids[j][2]) ** 2;
        if (dist < minDist) {
          minDist = dist;
          nearest = j;
        }
      }
      counts[nearest]++;
      sums[nearest][0] += pixel[0];
      sums[nearest][1] += pixel[1];
      sums[nearest][2] += pixel[2];
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

  // Find the largest cluster
  const clusterCounts = new Array(k).fill(0);
  for (const pixel of pixels) {
    let nearest = 0;
    let minDist = Infinity;
    for (let j = 0; j < k; j++) {
      const dist =
        (pixel[0] - centroids[j][0]) ** 2 +
        (pixel[1] - centroids[j][1]) ** 2 +
        (pixel[2] - centroids[j][2]) ** 2;
      if (dist < minDist) {
        minDist = dist;
        nearest = j;
      }
    }
    clusterCounts[nearest]++;
  }

  const dominant = clusterCounts.indexOf(Math.max(...clusterCounts));
  const [r, g, b] = centroids[dominant];

  return {
    hex: rgbToHex(r, g, b),
    rgb: rgbToString(r, g, b),
    r,
    g,
    b,
  };
}

export function exportAsJSON(colors: ColorSample[][]): string {
  return JSON.stringify(
    colors.map((row) => row.map(({ hex, rgb }) => ({ hex, rgb }))),
    null,
    2
  );
}

export function exportAsCSV(colors: ColorSample[][]): string {
  let csv = "Row,Column,HEX,RGB\n";
  colors.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      csv += `${rowIndex + 1},${colIndex + 1},${color.hex},${color.rgb}\n`;
    });
  });
  return csv;
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
