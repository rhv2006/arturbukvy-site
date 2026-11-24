// Рендерит og/og.html в public/og.jpg (превью ссылки 1200×630) через headless Chrome/Edge.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) throw new Error('Не найден Chrome/Edge. Укажите путь в CHROME_PATH.');

const png = resolve('og/og.png');
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  '--window-size=1200,630', '--force-device-scale-factor=1', '--virtual-time-budget=3000',
  `--screenshot=${png}`, pathToFileURL(resolve('og/og.html')).href,
], { stdio: 'ignore' });
// Chrome сохраняет только PNG; конвертируем в JPEG через sharp, если он есть, иначе оставляем PNG рядом.
const sharp = await import('sharp').then((m) => m.default).catch(() => null);
if (sharp) {
  await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(resolve('public/og.jpg'));
  rmSync(png);
  console.log('public/og.jpg');
} else {
  console.log(`${png} (sharp не установлен — сконвертируйте в public/og.jpg вручную)`);
}
