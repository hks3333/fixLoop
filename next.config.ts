import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pixelmatch and pngjs are CommonJS modules that use Buffer/fs — must stay server-side
  serverExternalPackages: ['pixelmatch', 'pngjs', 'playwright', 'playwright-core'],

  // Allow base64 PNG data URIs from screenshots
  images: {
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
