import React, { useEffect, useState } from 'react';
import { PROMO_CARDS } from '../../data/constants';
import { PromoArt } from '../market/PromoArt';
import { useUi } from '../../state/UiContext';
import { cn } from '../../utils/format';

/** Two-up promotional card carousel with dots + auto-advance. */
export function PromoCarousel(): React.ReactElement {
  const { openModal } = useUi();
  const [page, setPage] = useState(0);
  const pages = Math.ceil(PROMO_CARDS.length / 2);

  useEffect(() => {
    const t = window.setInterval(() => setPage((p) => (p + 1) % pages), 7000);
    return () => window.clearInterval(t);
  }, [pages]);

  const visible = PROMO_CARDS.slice(page * 2, page * 2 + 2);

  return (
    <section className="mx-auto max-w-shell px-4 pt-10">
      <div className="grid gap-5 md:grid-cols-2">
        {visible.map((card) => (
          <article key={card.id} className="flex overflow-hidden rounded-2xl border border-bd-light bg-white shadow-card">
            <div className="w-[180px] shrink-0">
              <PromoArt art={card.art} from={card.accentFrom} to={card.accentTo} height={190} />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-[16px] font-bold leading-snug text-txt-dark">{card.title}</h3>
              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="rounded bg-black/[.05] px-2 py-1 text-[11px] font-medium text-txt-darksec">
                  {card.tag}
                </span>
                <button
                  type="button"
                  onClick={() => openModal('promo', { promo: card })}
                  className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-night-900 transition-colors hover:bg-accent-hover"
                >
                  View more
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Promotion page ${i + 1}`}
            onClick={() => setPage(i)}
            className={cn('h-1.5 rounded-full transition-all', i === page ? 'w-5 bg-txt-dark' : 'w-1.5 bg-bd-light')}
          />
        ))}
      </div>
    </section>
  );
}
