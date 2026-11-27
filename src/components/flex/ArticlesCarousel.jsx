// Статьи об автоматизации: обложки бесконечной лентой, которая изгибается, проходя сквозь невидимое «жидкое стекло»
// (FlexCarousel из React Bits). Под лентой — название и дата статьи в центре и кнопка «Читать».
// Клик по боковой обложке подвигает её в центр, по центральной — открывает статью на Teletype.
import { useEffect, useState } from 'react';
import FlexCarousel from './FlexCarousel.jsx';
import './FlexCarousel.css';

export default function ArticlesCarousel({ articles }) {
  const [active, setActive] = useState(0);
  // края ленты поднимаются тем выше, чем шире экран, поэтому на компьютере лента идёт ниже середины сцены —
  // сверху остаётся место под изгиб; на телефоне изгиб маленький, лента выше, а под ней место для подписи
  const [layout, setLayout] = useState({ cardHeight: 0.4, rowY: 0.58 });
  useEffect(() => {
    const fit = () => setLayout(innerWidth < 700 ? { cardHeight: 0.5, rowY: 0.42 } : { cardHeight: 0.4, rowY: 0.58 });
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  const items = articles.map((a) => ({ src: a.cover, alt: a.title, title: a.title, subtitle: a.date }));
  const current = articles[active] || articles[0];
  const open = (i) => window.open(articles[i].url, '_blank', 'noopener');

  return (
    <div className="ac">
      <div className="ac-stage" data-cursor="Листать">
        <FlexCarousel
          items={items}
          preset="liquid"
          intro="bloom"
          cardHeight={layout.cardHeight}
          rowY={layout.rowY}
          gap={3}
          squeeze={0.2}
          focusOnClick={false}
          captions
          radius={12}
          lensWidth={0.55}
          lensHeight={0.56}
          tilt={-143}
          roundness={0.68}
          bend={0.4}
          reach={0.59}
          curl="rise"
          dispersion={0.48}
          liquid={0.54}
          followCursor
          autoplay
          // вертикальное колесо листает страницу, а не ленту; горизонтальный свайп тачпада — ленту
          captureWheel={false}
          onChange={(i) => setActive(i)}
          onSelect={(i) => open(i)}
        />
      </div>
      {current && (
        <div className="ac-cta">
          <a className="btn btn-primary" href={current.url} target="_blank" rel="noopener">
            Читать статью ↗
          </a>
        </div>
      )}
    </div>
  );
}
