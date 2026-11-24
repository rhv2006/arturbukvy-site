// Печатает resume/resume.html в public/fattakhov-resume.pdf через headless Chrome или Edge.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browsers = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const browser = browsers.find((b) => existsSync(b));
if (!browser) throw new Error('Не нашёл Chrome или Edge. Укажите путь в переменной CHROME_PATH.');

const src = pathToFileURL(resolve('resume/resume.html')).href;
const out = resolve('public/fattakhov-resume.pdf');
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--allow-file-access-from-files',
  '--virtual-time-budget=5000',
  `--print-to-pdf=${out}`,
  src,
], { stdio: 'inherit' });
console.log(`Готово: ${out}`);
