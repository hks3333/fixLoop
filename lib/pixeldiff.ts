// pixeldiff.ts — Fast pre-AI pixel diff triage layer
// This runs BEFORE the AI agents to avoid spending Cerebras credits on unchanged routes.
// Only chunks with > PIXEL_DIFF_THRESHOLD changed pixels are sent to Agent A.

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export type ChunkDiffResult = {
  score: number;           // 0–1, fraction of pixels changed
  diffImageBase64: string; // highlighted diff image as base64 PNG
  hasSignificantChange: boolean;
};

export type RouteDiffResult = {
  route: string;
  viewport: string;
  chunkIndex: number;
  baselineChunk: string;  // base64 PNG
  currentChunk: string;   // base64 PNG
  diff: ChunkDiffResult;
};

function diffChunk(
  baselineBase64: string,
  currentBase64: string,
  sensitivityThreshold: number
): ChunkDiffResult {
  const img1 = PNG.sync.read(Buffer.from(baselineBase64, 'base64'));
  const img2 = PNG.sync.read(Buffer.from(currentBase64, 'base64'));

  // Handle size mismatch (page layout shift can change total height)
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  const diff = new PNG({ width, height });

  // Crop data to the minimum size if images differ in size
  const data1 = (img1.width === width && img1.height === height)
    ? img1.data
    : cropImageData(img1.data, img1.width, width, height);

  const data2 = (img2.width === width && img2.height === height)
    ? img2.data
    : cropImageData(img2.data, img2.width, width, height);

  const numDiffPixels = pixelmatch(
    data1,
    data2,
    diff.data,
    width,
    height,
    { threshold: sensitivityThreshold, includeAA: false }
  );

  const score = numDiffPixels / (width * height);

  return {
    score,
    diffImageBase64: PNG.sync.write(diff).toString('base64'),
    hasSignificantChange: score > 0.02, // 2% threshold
  };
}

function cropImageData(
  data: Buffer,
  srcWidth: number,
  dstWidth: number,
  dstHeight: number
): Buffer {
  const result = Buffer.alloc(dstWidth * dstHeight * 4);
  for (let y = 0; y < dstHeight; y++) {
    const srcOffset = y * srcWidth * 4;
    const dstOffset = y * dstWidth * 4;
    data.copy(result, dstOffset, srcOffset, srcOffset + dstWidth * 4);
  }
  return result;
}

export function triageScreenshots(params: {
  baseline: { [route: string]: { [viewport: string]: string[] } };
  current: { [route: string]: { [viewport: string]: string[] } };
  sensitivityThreshold?: number;
}): RouteDiffResult[] {
  const { baseline, current, sensitivityThreshold = 0.1 } = params;
  const flagged: RouteDiffResult[] = [];

  for (const route of Object.keys(current)) {
    const baselineRoute = baseline[route];
    if (!baselineRoute) continue; // new route — all intentional, skip diff

    for (const viewport of Object.keys(current[route])) {
      const baselineChunks = baselineRoute[viewport] || [];
      const currentChunks = current[route][viewport];

      if (!currentChunks || currentChunks.length === 0) continue;

      const maxChunks = Math.min(baselineChunks.length, currentChunks.length);

      for (let i = 0; i < maxChunks; i++) {
        try {
          const diff = diffChunk(baselineChunks[i], currentChunks[i], sensitivityThreshold);
          if (diff.hasSignificantChange) {
            flagged.push({
              route,
              viewport,
              chunkIndex: i,
              baselineChunk: baselineChunks[i],
              currentChunk: currentChunks[i],
              diff,
            });
          }
        } catch (err) {
          console.warn(`pixeldiff: skipping chunk ${route}/${viewport}[${i}]:`, err);
        }
      }
    }
  }

  return flagged;
}
