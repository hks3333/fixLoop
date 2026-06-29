import { chromium, Browser } from 'playwright';
import { VIEWPORTS, SCREENSHOT_CHUNK_HEIGHT } from './config';

export type ViewportName = 'mobile' | 'tablet' | 'desktop';

export type RouteScreenshots = {
  [viewport in ViewportName]?: string[]; // array of base64 PNG chunks
};

export type SiteScreenshots = {
  [routePath: string]: RouteScreenshots;
};

// ─── Legacy type (kept for backward compat with existing demo) ────────────────
export type ScreenshotSet = {
  desktop: string;
  mobile: string;
};

async function screenshotPage(
  browser: Browser,
  url: string,
  viewport: { name: string; width: number; height: number }
): Promise<{ chunks: string[]; consoleErrors: string[] }> {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent:
      'Mozilla/5.0 (compatible; FixLoop/1.0; +https://fixloop.dev) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    // fallback — some sites don't reach networkidle
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(500);

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const chunks: string[] = [];

  if (pageHeight <= viewport.height * 1.5) {
    const shot = await page.screenshot({ fullPage: false });
    chunks.push(shot.toString('base64'));
  } else {
    let scrollY = 0;
    while (scrollY < pageHeight) {
      await page.evaluate((y: number) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(150);
      const shot = await page.screenshot({ fullPage: false });
      chunks.push(shot.toString('base64'));
      scrollY += SCREENSHOT_CHUNK_HEIGHT;
    }
  }

  await context.close();
  return { chunks, consoleErrors };
}

export async function screenshotRoute(
  url: string,
  viewportNames: ViewportName[] = ['mobile', 'desktop']
): Promise<{ screenshots: RouteScreenshots; consoleErrors: string[] }> {
  console.log(`[screenshotter] Launching browser for route ${url}...`);
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const result: RouteScreenshots = {};
  const allConsoleErrors: string[] = [];

  for (const vp of VIEWPORTS.filter(v => viewportNames.includes(v.name as ViewportName))) {
    const { chunks, consoleErrors } = await screenshotPage(browser, url, vp);
    result[vp.name as ViewportName] = chunks;
    allConsoleErrors.push(...consoleErrors);
  }

  await browser.close();
  return { screenshots: result, consoleErrors: allConsoleErrors };
}

export async function screenshotSite(
  baseUrl: string,
  routes: Array<{ path: string; name: string }>,
  viewportNames: ViewportName[] = ['mobile', 'desktop']
): Promise<{ screenshots: SiteScreenshots; consoleErrors: { [route: string]: string[] } }> {
  console.log(`[screenshotter] screenshotSite: Launching browser for ${routes.length} routes...`);
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const screenshots: SiteScreenshots = {};
  const consoleErrors: { [route: string]: string[] } = {};

  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    const routeResult: RouteScreenshots = {};
    const routeErrors: string[] = [];

    for (const vp of VIEWPORTS.filter(v => viewportNames.includes(v.name as ViewportName))) {
      const { chunks, consoleErrors: errs } = await screenshotPage(browser, url, vp);
      routeResult[vp.name as ViewportName] = chunks;
      routeErrors.push(...errs);
    }

    screenshots[route.path] = routeResult;
    consoleErrors[route.path] = routeErrors;
  }

  await browser.close();
  return { screenshots, consoleErrors };
}

export async function measurePerformance(url: string): Promise<{
  ttfb: number;
  domInteractive: number;
  loadComplete: number;
}> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    await page.waitForTimeout(2000);
  }

  const timing = await page.evaluate(() => {
    const t = (window.performance as any).timing;
    if (!t) return { ttfb: 0, domInteractive: 0, loadComplete: 0 };
    return {
      ttfb: t.responseStart - t.navigationStart,
      domInteractive: t.domInteractive - t.navigationStart,
      loadComplete: t.loadEventEnd - t.navigationStart,
    };
  });

  await browser.close();
  return timing;
}

// ─── Legacy function — kept for backward compat with the demo ─────────────────
export async function takeScreenshots(): Promise<ScreenshotSet> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const browser = await chromium.launch({ headless: true });

  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto(`${APP_URL}/checkout-preview`, { waitUntil: 'networkidle' });
  await desktopPage.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 500));
  const desktopShot = await desktopPage.screenshot({ fullPage: true });

  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${APP_URL}/checkout-preview`, { waitUntil: 'networkidle' });
  await mobilePage.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 500));
  const mobileShot = await mobilePage.screenshot({ fullPage: true });

  await browser.close();

  return {
    desktop: desktopShot.toString('base64'),
    mobile: mobileShot.toString('base64'),
  };
}
