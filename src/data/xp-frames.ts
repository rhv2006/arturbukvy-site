// Кадры окна Render View в секции «Опыт».
// Окно показывает последний кадр, чей year <= текущего года таймлайна; на дорожке «Кейсы» — маркер на каждый кадр.
//
// Как добавить кадр:
// 1. Положите картинку в public/xp/: 4:3 горизонтальная, около 1600 × 1200, WebP.
// 2. Добавьте запись в массив ниже:
//    src  — путь от корня сайта, '/xp/имя.webp'
//    file — имя файла в шапке окна («Render View · {file}»)
//    job  — точное значение поля layer из src/data/experience.json
//    year — дробный год (2023.5 = середина 2023). Можно числом
//           или через start/onKey/spread ниже, чтобы встать на начало или ромбики работы.
//    alt  — что изображено на картинке
//
// Точных дат у кадров нет, поэтому они стоят на ромбиках фактов своей работы (onKey),
// а у Роснефти четыре кадра распределены равномерно по периоду работы (spread).

import experience from './experience.json';

export type XpFrame = { src: string; file: string; job: string; year: number; alt: string };

const ym = (s: string, end = false) => {
  const [y, m] = s.split('-').map(Number);
  return y + (end ? m : m - 1) / 12;
};
const period = (layer: string) => {
  const job = experience.find((j) => j.layer === layer);
  if (!job) throw new Error(`xp-frames: нет работы с layer «${layer}» в experience.json`);
  return { job, from: ym(job.from), to: ym(job.to, true) };
};
/** год k-го ромбика работы — та же формула, что у кейфреймов в index.astro */
const onKey = (layer: string, k: number) => {
  const { job, from, to } = period(layer);
  return +(from + ((to - from) * (k + 1)) / (job.points.length + 1)).toFixed(4);
};
/** начало работы */
const start = (layer: string) => +period(layer).from.toFixed(4);
/** k-я из n равномерных точек внутри периода работы */
const spread = (layer: string, k: number, n: number) => {
  const { from, to } = period(layer);
  return +(from + ((to - from) * (k + 1)) / (n + 1)).toFixed(4);
};

export const xpFrames: XpFrame[] = [
  // Агентства и фриланс (rechi media) — обложки SMM-кейсов.
  // Первый кадр стоит в самом начале дорожки, чтобы окно не было пустым с 2011 года.
  {
    src: '/xp/smartykids-cover.webp',
    file: 'smartykids-cover.webp',
    job: 'Агентства',
    year: start('Агентства'),
    alt: 'Обложка SMM-кейса SmartyKids: объёмный розовый логотип на фиолетовом фоне',
  },
  {
    src: '/xp/delilabs-cover.webp',
    file: 'delilabs-cover.webp',
    job: 'Агентства',
    year: onKey('Агентства', 0),
    alt: 'Обложка SMM-кейса DeliLabs: упаковка супа-пюре с белыми грибами и холщовый мешочек с логотипом',
  },
  {
    src: '/xp/samocat-cover.webp',
    file: 'samocat-cover.webp',
    job: 'Агентства',
    year: onKey('Агентства', 1),
    alt: 'Обложка SMM-кейса Samocat Sharing: парень в прыжке с электросамокатом на оранжевом фоне',
  },

  // Роснефть (РН-УфаНИПИнефть)
  {
    src: '/xp/rn-icons.webp',
    file: 'rn-icons.webp',
    job: 'Роснефть',
    year: spread('Роснефть', 0, 4),
    alt: 'Набор отраслевых пиктограмм: графики, документы, буровые установки, лаборатория, сотрудники в касках',
  },
  {
    src: '/xp/rn-marathon-01.webp',
    file: 'rn-marathon-01.webp',
    job: 'Роснефть',
    year: spread('Роснефть', 1, 4),
    alt: 'Изометрическая иллюстрация для марафона: роботизированный манипулятор и терминал в жёлтых тонах',
  },
  {
    src: '/xp/rn-marathon-02.webp',
    file: 'rn-marathon-02.webp',
    job: 'Роснефть',
    year: spread('Роснефть', 2, 4),
    alt: 'Изометрическая иллюстрация для марафона: объёмный график поверхности, разрез пласта и приборная панель',
  },
  {
    src: '/xp/rn-marathon-04.webp',
    file: 'rn-marathon-04.webp',
    job: 'Роснефть',
    year: spread('Роснефть', 3, 4),
    alt: 'Изометрическая иллюстрация для марафона: промышленный робот-манипулятор рядом с терминалом',
  },

  // Альфа-Банк — кейс «Key visuals for app»
  {
    src: '/xp/alfa-mts.webp',
    file: 'alfa-mts.webp',
    job: 'Альфа-Банк',
    year: onKey('Альфа-Банк', 0),
    alt: '3D key visual: красная плитка с объёмными буквами МТС, плашка KION и синяя фигура на салатовом фоне',
  },
  {
    src: '/xp/alfa-tv.webp',
    file: 'alfa-tv.webp',
    job: 'Альфа-Банк',
    year: onKey('Альфа-Банк', 1),
    alt: '3D key visual: фиолетовая бархатная фигура, телевизор и оранжевый роутер на голубом фоне',
  },
  {
    src: '/xp/alfa-basket.webp',
    file: 'alfa-basket.webp',
    job: 'Альфа-Банк',
    year: onKey('Альфа-Банк', 2),
    alt: '3D key visual: золотая корзинка со значками hh и Яндекса на сиреневом фоне',
  },

  // pronew — кейс «Баннеры для ОТП Банка»
  {
    src: '/xp/otp-cashback.webp',
    file: 'otp-cashback.webp',
    job: 'pronew',
    year: onKey('pronew', 0),
    alt: 'Баннер ОТП Банка «Деньги делают камбэк»: кешбэк на самое главное до 3000 ₽ в месяц',
  },
  {
    src: '/xp/otp-top.webp',
    file: 'otp-top.webp',
    job: 'pronew',
    year: onKey('pronew', 1),
    alt: 'Баннер ОТП Банка «Из базы в топ»: кешбэк до 35% по дебетовой карте',
  },
];
