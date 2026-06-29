import fs from 'fs';
import path from 'path';
import type { BaselineMeta } from './types';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'baselines');

function routeToSlug(routePath: string): string {
  return routePath === '/' ? 'root' : routePath.replace(/^\//, '').replace(/\//g, '_');
}

function slugToRoute(slug: string): string {
  return slug === 'root' ? '/' : `/${slug.replace(/_/g, '/')}`;
}

export function saveBaseline(
  routePath: string,
  viewport: string,
  chunks: string[]
): void {
  const dir = path.join(STORAGE_DIR, routeToSlug(routePath));
  fs.mkdirSync(dir, { recursive: true });

  // Write each chunk as a PNG
  chunks.forEach((chunk, i) => {
    fs.writeFileSync(
      path.join(dir, `${viewport}_chunk${i}.png`),
      Buffer.from(chunk, 'base64')
    );
  });

  // Update metadata
  const metaPath = path.join(dir, 'meta.json');
  const meta: BaselineMeta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : {};
  meta[viewport] = { chunkCount: chunks.length, savedAt: new Date().toISOString() };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

export function loadBaseline(
  routePath: string,
  viewport: string
): string[] | null {
  const dir = path.join(STORAGE_DIR, routeToSlug(routePath));
  const metaPath = path.join(dir, 'meta.json');

  if (!fs.existsSync(metaPath)) return null;

  const meta: BaselineMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  if (!meta[viewport]) return null;

  const chunks: string[] = [];
  for (let i = 0; i < meta[viewport].chunkCount; i++) {
    const chunkPath = path.join(dir, `${viewport}_chunk${i}.png`);
    if (!fs.existsSync(chunkPath)) return null;
    chunks.push(fs.readFileSync(chunkPath).toString('base64'));
  }

  return chunks;
}

export function loadAllBaselines(): {
  [route: string]: { [viewport: string]: string[] };
} {
  const result: { [route: string]: { [viewport: string]: string[] } } = {};

  if (!fs.existsSync(STORAGE_DIR)) return result;

  const slugDirs = fs.readdirSync(STORAGE_DIR).filter(s =>
    fs.statSync(path.join(STORAGE_DIR, s)).isDirectory()
  );

  for (const slug of slugDirs) {
    const metaPath = path.join(STORAGE_DIR, slug, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const meta: BaselineMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const routePath = slugToRoute(slug);
    result[routePath] = {};

    for (const viewport of Object.keys(meta)) {
      const chunks = loadBaseline(routePath, viewport);
      if (chunks) result[routePath][viewport] = chunks;
    }
  }

  return result;
}

export function getBaselineMeta(): {
  [route: string]: BaselineMeta;
} {
  const result: { [route: string]: BaselineMeta } = {};

  if (!fs.existsSync(STORAGE_DIR)) return result;

  const slugDirs = fs.readdirSync(STORAGE_DIR).filter(s =>
    fs.statSync(path.join(STORAGE_DIR, s)).isDirectory()
  );

  for (const slug of slugDirs) {
    const metaPath = path.join(STORAGE_DIR, slug, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;
    const meta: BaselineMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    result[slugToRoute(slug)] = meta;
  }

  return result;
}

export function promoteToBaseline(
  routePath: string,
  viewport: string,
  newChunks: string[]
): void {
  // Archive current baseline
  const dir = path.join(STORAGE_DIR, routeToSlug(routePath));
  const archiveDir = path.join(
    dir,
    'archive',
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  fs.mkdirSync(archiveDir, { recursive: true });

  const metaPath = path.join(dir, 'meta.json');
  if (fs.existsSync(metaPath)) {
    const meta: BaselineMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (meta[viewport]) {
      for (let i = 0; i < meta[viewport].chunkCount; i++) {
        const src = path.join(dir, `${viewport}_chunk${i}.png`);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(archiveDir, `${viewport}_chunk${i}.png`));
        }
      }
    }
  }

  // Save promoted baseline
  saveBaseline(routePath, viewport, newChunks);
}
