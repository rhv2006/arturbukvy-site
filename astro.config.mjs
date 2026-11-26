import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Висячие предлоги: после коротких слов («в», «и», «на», «для»…) ставим неразрывный пробел,
// чтобы они не оставались в конце строки, а тире не переносилось в начало следующей.
// Пробел после слова может быть и переносом строки в исходнике, и стоять перед тегом (<a>, <b>) — тоже привязываем.
// Работает на готовом HTML после сборки, поэтому охватывает весь текст, включая кейсы и статьи из RSS.
const NBSP = ' ';
const SHORT = /(^|[\s(«"„> ])((?:[а-яёa-z]{1,2}|для|без|над|под|при|про|или|как|что|из-за|из-под))[ \t\r\n]+(?=\S|$)/giu;
const DASH = /[ \t\r\n]+(—|–)(?=[ \t\r\n])/g;
const NUM_UNIT = /(\d)[ \t\r\n]+(?=(?:лет|года?|мес|млн|тыс|₽|%|экран|ролик|формат|пост)[а-яё]*)/giu;

function typograph(text) {
  let out = text;
  // два прохода: в цепочках вроде «и в» второе слово становится видно только после первого
  for (let i = 0; i < 2; i++) out = out.replace(SHORT, `$1$2${NBSP}`);
  return out.replace(DASH, `${NBSP}$1`).replace(NUM_UNIT, `$1${NBSP}`);
}

// <script>/<style>/<pre>/<textarea> и комментарии берём целиком и не трогаем: «<» внутри скрипта
// иначе ломает разбор тегов, и весь текст страницы после него оставался без типографа
const HTML_PARTS = /<(script|style|pre|textarea)\b[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<[^>]+>|([^<]+)/gi;

function processHtml(html) {
  return html.replace(HTML_PARTS, (part, _raw, text) => (text ? typograph(text) : part));
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
    // то же на локальном сервере (astro dev): собираем HTML-ответ целиком и прогоняем через типограф
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, res, next) => {
        const accept = req.headers.accept || '';
        if (req.method !== 'GET' || !accept.includes('text/html')) return next();
        const chunks = [];
        const write = res.write.bind(res);
        const end = res.end.bind(res);
        const writeHead = res.writeHead.bind(res);
        // длина ответа после замены пробелов на неразрывные меняется — исходную не отправляем
        res.writeHead = (code, ...rest) => {
          res.removeHeader('content-length');
          const strip = (h) =>
            h && typeof h === 'object' && !Array.isArray(h)
              ? Object.fromEntries(Object.entries(h).filter(([k]) => k.toLowerCase() !== 'content-length'))
              : h;
          return writeHead(code, ...rest.map(strip));
        };
        res.write =(chunk, ...rest) => {
          if (chunk) chunks.push(Buffer.from(chunk));
          if (typeof rest.at(-1) === 'function') rest.at(-1)();
          return true;
        };
        res.end = (chunk, ...rest) => {
          if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk));
          let body = Buffer.concat(chunks);
          if (String(res.getHeader('content-type') || '').includes('text/html')) {
            body = Buffer.from(processHtml(body.toString('utf8')));
            if (!res.headersSent) res.setHeader('content-length', body.length);
          }
          if (!res.headersSent) res.removeHeader('transfer-encoding');
          write(body);
          return end();
        };
        next();
      });
    },
  },
};

export default defineConfig({
  site: 'https://xn--80acd5a2aanic6f.xn--p1ai',
  integrations: [typography],
  // обложки Behance пережимаются при сборке в свои файлы: у CDN Behance нет CORS, а WebGL-галерее #work нужны текстуры с нашего домена
  image: { domains: ['mir-s3-cdn-cf.behance.net'] },
  // /опросник — то же, что /oprosnik
  redirects: { '/опросник': '/oprosnik/' },
});
