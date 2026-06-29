import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function routeToSlug(routePath: string): string {
  return routePath === '/' ? 'root' : routePath.replace(/^\//, '').replace(/\//g, '_');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');
  const viewport = searchParams.get('viewport');
  const chunkIndex = searchParams.get('chunkIndex') || '0';

  if (!route || !viewport) {
    return new NextResponse('Missing route or viewport', { status: 400 });
  }

  const slug = routeToSlug(route);
  const filePath = path.join(process.cwd(), 'storage', 'baselines', slug, `${viewport}_chunk${chunkIndex}.png`);

  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  } catch (err) {
    console.error('Failed to read image:', err);
  }

  return new NextResponse('Image not found', { status: 404 });
}
