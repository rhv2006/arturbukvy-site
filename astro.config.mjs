import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Висячие предлоги: после коротких слов («в», «и», «на», «для»…) ставим неразрывный пробел,
// чтобы они не оставались в конце строки, а тире не переносилось в начало следующей.
// Работает на готовом HTML после сборки, поэтому охватывает весь текст, включая кейсы и статьи из RSS.
const NBSP = ' ';
const SHORT = /(^|[\s(«"„> ])((?:[а-яёa-z]{1,2}|для|без|над|под|при|про|или|как|что|из-за|из-под)) (?=\S)/giu;
const DASH = / (—|–)(?= )/g;
const NUM_UNIT = /(\d) (?=(?:лет|года?|мес|млн|тыс|₽|%|экран|ролик|формат|пост)[а-яё]*)/giu;

function typograph(text) {
  let out = text;
  // два прохода: в цепочках вроде «и в» второе слово становится видно только после первого
  for (let i = 0; i < 2; i++) out = out.replace(SHORT, `$1$2${NBSP}`);
  return out.replace(DASH, `${NBSP}$1`).replace(NUM_UNIT, `$1${NBSP}`);
}

function processHtml(html) {
  let skip = null; // внутри <script>/<style>/<pre>/<textarea> текст не трогаем
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        const m = part.match(/^<(\/?)(script|style|pre|textarea)\b/i);
        if (m) skip = m[1] ? null : m[2].toLowerCase();
        return part;
      }
      return skip ? part : typograph(part);
    })
    .join('');
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return htmlFiles(p);
      return e.name.endsWith('.html') ? [p] : [];
    }),
  );
  return nested.flat();
}

const typography = {
  name: 'nbsp-typography',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      for (const file of await htmlFiles(fileURLToPath(dir))) {
        await writeFile(file, processHtml(await readFile(file, 'utf8')));
      }
    },
  },
};

export default defineConfig({
  site: 'https://xn--80acd5a2aanic6f.xn--p1ai',
  integrations: [typography],
  // /опросник — то же, что /oprosnik
  redirects: { '/опросник': '/oprosnik/' },
});
