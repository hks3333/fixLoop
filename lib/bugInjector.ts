import fs from 'fs';
import path from 'path';

const CSS_PATH = path.join(process.cwd(), 'styles', 'checkout.css');

export const BUG = {
  file: 'styles/checkout.css',
  line: 258,
  property: 'z-index',
  before: '10',
  after: '0',
  description: 'z-index on .button-wrapper changed from 10 to 0, causing the checkout button to render behind the dark overlay and become unclickable.',
};

export function injectBug(): void {
  let css = fs.readFileSync(CSS_PATH, 'utf-8');
  css = css.replace('z-index: 10; /* BUG TARGET: agents will change this to 0 */', 'z-index: 0; /* INJECTED BUG */');
  fs.writeFileSync(CSS_PATH, css, 'utf-8');
}

export function restoreBug(): void {
  let css = fs.readFileSync(CSS_PATH, 'utf-8');
  css = css.replace('z-index: 0; /* INJECTED BUG */', 'z-index: 10; /* BUG TARGET: agents will change this to 0 */');
  fs.writeFileSync(CSS_PATH, css, 'utf-8');
}

export function getCurrentCSS(): string {
  return fs.readFileSync(CSS_PATH, 'utf-8');
}

export function applyPatch(lineNumber: number, oldCode: string, newCode: string): void {
  let css = fs.readFileSync(CSS_PATH, 'utf-8');
  css = css.replace(oldCode, newCode);
  fs.writeFileSync(CSS_PATH, css, 'utf-8');
}
