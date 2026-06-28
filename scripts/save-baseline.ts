import { takeScreenshots } from '../lib/screenshotter';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Taking baseline screenshots...');
  const shots = await takeScreenshots();

  const dir = path.join(process.cwd(), 'public', 'baseline');
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(dir, 'desktop.png'), Buffer.from(shots.desktop, 'base64'));
  fs.writeFileSync(path.join(dir, 'mobile.png'), Buffer.from(shots.mobile, 'base64'));

  console.log('Baseline saved to public/baseline/');
}

main();
