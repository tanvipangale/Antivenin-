import { useEffect, useState } from 'react';
import { getWikiThumbnail } from '../utils/Wikiimage';
import { SnakeSilhouette, ScorpionSilhouette } from './Icons';

export default function SpeciesCard({ species, kind = 'snake', caption, compact = false }) {
  const [imgUrl, setImgUrl] = useState(null);
  const Fallback = kind === 'scorpion' ? ScorpionSilhouette : SnakeSilhouette;

  useEffect(() => {
    let cancelled = false;
    setImgUrl(null);
    getWikiThumbnail(species.wikiTitle).then(url => !cancelled && url && setImgUrl(url));
    return () => { cancelled = true; };
  }, [species.wikiTitle]);

  const image = imgUrl ? (
    <img src={imgUrl} alt={species.name} className="h-full w-full object-cover" onError={() => setImgUrl(null)} />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-olive/10 text-olive/40">
      <Fallback className={compact ? 'h-6 w-6' : 'h-10 w-10'} />
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">{image}</div>
        <p className="text-xs font-medium leading-tight text-ink/75">{species.name}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-ink/10 bg-cream/40">
      <div className="aspect-square w-full">{image}</div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-center">
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-ink/80">{species.name}</p>
        {caption && <span className="text-[9px] uppercase tracking-[.13em] text-ink/35">{caption}</span>}
      </div>
    </div>
  );
}