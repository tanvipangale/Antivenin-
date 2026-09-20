import { VialIcon } from './Icons';
import { antivenomInfo } from '../data/antivenomInfo';

// A reference scale for the visual fill level only
const VISUAL_SCALE_MAX = 30;

function levelColor(totalQty) {
  if (totalQty <= 0) return { text: 'text-ink/30', label: 'None found nearby', badge: 'bg-ink/10 text-ink/50' };
  if (totalQty < 6) return { text: 'text-clay', label: 'Low', badge: 'bg-clay/15 text-clay' };
  return { text: 'text-olive', label: 'Available', badge: 'bg-olive/15 text-olive' };
}

/**
 * Aggregates antivenom quantities across every facility currently on
 * screen (the ones with hasAnyStock) into one number per antivenom typ
 * a "lab inventory board" view of what's available in the searched area.
 */
export default function AntivenomLabPanel({ facilities }) {
  const totals = antivenomInfo.map((info) => {
    const acceptedNames = [info.name, ...(info.aliases || [])].map((n) => n.trim().toLowerCase());
    let totalQty = 0;
    let facilityCount = 0;
    for (const f of facilities) {
      const match = f.stock?.find((s) => acceptedNames.includes(s.name?.trim().toLowerCase()));
      if (match && match.quantity > 0) {
        totalQty += match.quantity;
        facilityCount += 1;
      }
    }
    return { ...info, totalQty, facilityCount };
  });

  return (
    <div className="rounded-[14px] border border-ink/10 bg-surface p-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink/50">
        Antivenom availability — this area
      </h2>
      <p className="mb-5 text-xs text-ink/40">
        Total vials reported by hospitals/clinics currently shown below, combined.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {totals.map((t) => {
          const fillPercent = Math.min(100, (t.totalQty / VISUAL_SCALE_MAX) * 100);
          const level = levelColor(t.totalQty);
          return (
            <div key={t.id} className="flex items-start gap-4 rounded-[12px] bg-cream/60 p-4">
              <VialIcon className={`h-10 w-10 shrink-0 ${level.text}`} fillPercent={fillPercent} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${level.badge}`}>
                    {level.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-ink">
                  {t.totalQty}
                  <span className="ml-1 text-xs font-normal text-ink/40">vials</span>
                </p>
                <p className="text-xs text-ink/50">
                  across {t.facilityCount} {t.facilityCount === 1 ? 'facility' : 'facilities'}
                </p>
                {/* lab-style level bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      t.totalQty <= 0 ? 'bg-ink/15' : t.totalQty < 6 ? 'bg-clay' : 'bg-olive'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}