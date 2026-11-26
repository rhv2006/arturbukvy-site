// Снимок кейса с Behance для страницы на сайте.
//
// Страница проекта на Behance закрыта проверкой от ботов, поэтому сборка на GitHub
// забрать её не может. Снимок делается в обычном браузере на открытой странице кейса:
// вставить этот код в консоль (F12) — в буфере обмена окажется JSON,
// его нужно сохранить в src/data/projects/<id>.json.
//
// Картинки в JSON остаются ссылками на CDN Behance (он открыт), при сборке
// Astro скачивает исходники и пережимает их в WebP на нашем домене.
(() => {
  const state = JSON.parse(document.querySelector('#beconfig-store_state').textContent);
  const p = state.project.project;

  // самый большой не-webp вариант: source, если есть, иначе по ширине
  const best = (sizes) => {
    const all = (sizes?.allAvailable ?? []).filter((s) => s.url && s.type !== 'WEBP');
    const src = all.find((s) => s.url.includes('/source/'));
    return src ?? all.sort((a, b) => b.width - a.width)[0];
  };
  const image = (m) => {
    const b = best(m.imageSizes);
    if (!b) return null;
    // высоту считаем по пропорции размера 1400 (у source её нет)
    const ref = m.imageSizes.size_1400 ?? m.imageSizes.size_max_1200 ?? m.imageSizes.size_disp;
    const h = ref?.width ? Math.round((b.width * ref.height) / ref.width) : undefined;
    return { src: b.url, width: b.width, height: h, gif: /\.gif$/i.test(b.url) || undefined };
  };
  const vimeoId = (html) => html?.match(/player\.vimeo\.com\/video\/(\d+)/)?.[1];

  const modules = p.allModules
    .map((m) => {
      switch (m.__typename) {
        case 'ImageModule': {
          const img = image(m);
          return img && { type: 'image', ...img, fullBleed: !!m.fullBleed, caption: m.captionPlain || undefined };
        }
        case 'MediaCollectionModule':
          return {
            type: 'grid',
            images: (m.components ?? []).map((c) => image(c)).filter(Boolean),
            caption: m.captionPlain || undefined,
          };
        case 'EmbedModule': {
          const id = vimeoId(m.originalEmbed);
          const size = { width: m.originalWidth || m.width, height: m.originalHeight || m.height, fullBleed: !!m.embedModuleFullBleed };
          return id ? { type: 'vimeo', id, ...size } : { type: 'embed', html: m.originalEmbed, ...size };
        }
        case 'TextModule':
          return { type: 'text', html: m.text };
        default:
          console.warn('Неизвестный модуль Behance', m.__typename, m);
          return null;
      }
    })
    .filter(Boolean);

  const css = p.stylesInline ?? '';
  const pc = css.match(/#primary-project-content \{([^}]*)\}/)?.[1] ?? '';
  const bg = pc.match(/background-color:\s*(#[0-9a-f]{3,8})/i)?.[1];
  const paddingTop = Number(pc.match(/padding-top:\s*(\d+)px/)?.[1] ?? 0);
  const textColor = css.match(/\.main-text \{ color: (#[0-9a-f]{3,8})/i)?.[1];
  const linkColor = css.match(/\.main-text a \{ color: (#[0-9a-f]{3,8})/i)?.[1];
  const gap = Number(css.match(/\.spacer \{ height: (\d+)px/)?.[1] ?? 0);

  const out = {
    id: String(p.id),
    slug: p.slug.toLowerCase(),
    title: p.name,
    url: p.url,
    description: p.description || undefined,
    tags: p.tags?.map((t) => t.title.trim()),
    published: new Date(p.publishedOn * 1000).toISOString().slice(0, 10),
    canvas: { width: p.canvasWidth || 1400, background: bg, paddingTop, gap, textColor, linkColor },
    modules,
  };
  const json = JSON.stringify(out, null, 2);
  if (typeof copy === 'function') copy(json); // copy() есть только в консоли DevTools
  return out;
})();
