import { chromium } from 'playwright';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type ScreenshotSet = {
  desktop: string;
  mobile: string;
};

export async function takeScreenshots(): Promise<ScreenshotSet> {
  const browser = await chromium.launch({ headless: true });

  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto(`${APP_URL}/checkout-preview`, { waitUntil: 'networkidle' });
  const desktopShot = await desktopPage.screenshot({ fullPage: false });

  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${APP_URL}/checkout-preview`, { waitUntil: 'networkidle' });
  const mobileShot = await mobilePage.screenshot({ fullPage: false });

  await browser.close();

  return {
    desktop: desktopShot.toString('base64'),
    mobile: mobileShot.toString('base64'),
  };
}
