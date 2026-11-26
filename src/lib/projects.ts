// Страницы кейсов на сайте. Содержимое — снимки проектов Behance в src/data/projects/*.json
// (как их делать — scripts/behance-project.js). Кейс без снимка ведёт на Behance, как раньше.

export interface ProjectImage {
  src: string;
  width: number;
  height?: number;
  gif?: boolean;
}

export type ProjectModule =
  | ({ type: 'image'; fullBleed?: boolean; caption?: string } & ProjectImage)
  | { type: 'grid'; images: ProjectImage[]; caption?: string }
  | { type: 'vimeo'; id: string; width: number; height: number; fullBleed?: boolean }
  | { type: 'youtube'; id: string; width: number; height: number; fullBleed?: boolean }
  /** GIF с Behance, переведённый в mp4 (public/projects/<id>/) */
  | { type: 'loop'; src: string; width: number; height: number; fullBleed?: boolean }
  /** прочие плееры (видео, загруженное прямо в Behance) — iframe как есть */
  | { type: 'embed'; src: string; width: number; height: number; fullBleed?: boolean }
  | { type: 'text'; html: string };

export interface Project {
  id: string;
  slug: string;
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  published: string;
  canvas: {
    width: number;
    background?: string;
    paddingTop?: number;
    gap?: number;
    textColor?: string;
    linkColor?: string;
  };
  modules: ProjectModule[];
}

const files = import.meta.glob<Project>('../data/projects/*.json', { eager: true, import: 'default' });

export const projects: Project[] = Object.values(files);

export const projectPath = (p: Pick<Project, 'slug'>) => `/works/${p.slug}/`;

/** Адрес страницы кейса на сайте по id Behance, если снимок есть. */
export function pageFor(id: string): string | undefined {
  const p = projects.find((x) => x.id === id);
  return p && projectPath(p);
}

/** Превью Vimeo для заглушки до загрузки плеера. */
export async function vimeoThumb(id: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=1920`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}
