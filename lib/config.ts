export const ROUTES_TO_CHECK = [
  { path: '/', name: 'Homepage', critical: true },
];

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

export const PIXEL_DIFF_THRESHOLD = 0.02; // 2% of pixels changed = worth investigating
export const PIXEL_DIFF_SENSITIVITY = 0.1; // per-pixel sensitivity (0–1, lower = more sensitive)

export const MAX_LOOP_RETRIES = 3;
export const SCREENSHOT_CHUNK_HEIGHT = 900; // px — chunk height for tall pages
