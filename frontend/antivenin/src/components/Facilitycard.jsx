import {
  HospitalIcon, PhoneIcon, DirectionsIcon, ExternalIcon,
  PlayIcon, StopIcon, StethoscopeIcon, PillIcon, StarIcon
} from './Icons';
import { hasAnyStock } from '../utils/hospitalSearch';

const tel = p => `tel:${p.replace(/[^\d+]/g, '')}`;

export const TYPE_LABEL = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  doctor: "Doctor's office",
  pharmacy: 'Pharmacy / medical shop',
};

export function TypeIcon({ type, className }) {
  return type === 'pharmacy'
    ? <PillIcon className={className} />
    : type === 'doctor'
      ? <StethoscopeIcon className={className} />
      : <HospitalIcon className={className} />;
}

export default function FacilityCard({
  hospital: h, rank, isRouting, routeSummary, navigating,
  liveRemainingKm, liveEtaMin, onGetDirections, onStart, onStop
}) {
  const stocked = hasAnyStock(h);
  const dist = h.distanceKm != null ? `${Number(h.distanceKm).toFixed(1)} km` : 'Unavailable';

  return (
    <div className={`relative flex h-full min-h-[250px] flex-col rounded-[16px] border bg-surface p-5 ${
      rank ? 'border-select/50 shadow-[0_4px_18px_-8px_rgba(62,124,177,0.35)]' : 'border-ink/10'
    }`}>

      {rank && (
        <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-select px-2.5 py-1 text-xs font-bold text-white">
          <StarIcon className="h-3 w-3" />#{rank} pick
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive/10 text-olive">
            <TypeIcon type={h.type} className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="font-semibold text-ink">{h.name}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
              {TYPE_LABEL[h.type] || 'Clinic'}
            </p>
            <p className="mt-1 text-sm text-ink/55">{h.address || 'Address unavailable'}</p>

            {h.phone && (
              <a href={tel(h.phone)} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-select">
                <PhoneIcon className="h-3.5 w-3.5" />{h.phone}
              </a>
            )}
          </div>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
          stocked ? 'bg-olive/15 text-olive' : 'bg-clay/15 text-clay'
        }`}>
          {stocked ? 'Antivenom in stock' : 'No stock reported'}
        </span>
      </div>

      <div className="my-4 border-t border-ink/10" />

      <div className="grid grid-cols-2 gap-4">
        <div className="border-r border-ink/10">
          <p className="text-xs uppercase tracking-wide text-ink/40">Distance</p>
          <p className="mt-1 text-sm font-semibold text-ink">{dist}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40">Antivenom</p>
          {h.stock?.length ? h.stock.map(s => (
            <p key={s.id} className={`mt-1 text-sm font-semibold ${s.quantity > 0 ? 'text-olive' : 'text-clay'}`}>
              {s.name}: {s.quantity > 0 ? s.quantity : 'Out of stock'}
            </p>
          )) : (
            <p className={`mt-1 text-xs ${h.type === 'pharmacy' ? 'text-ink/50' : 'text-clay'}`}>
              {h.type === 'pharmacy' ? 'Call ahead to check stock.' : 'Stock not reported'}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {isRouting && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          {navigating && liveRemainingKm != null && (
            <p className="mb-2 text-sm font-semibold text-select">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-select" />
              {Number(liveRemainingKm).toFixed(1)} km remaining
              {liveEtaMin != null && ` · ~${Math.round(liveEtaMin)} min away`}
            </p>
          )}

          {routeSummary && (
            <p className="mb-3 text-xs text-ink/45">
              Route: {routeSummary.distanceKm != null
                ? `${Number(routeSummary.distanceKm).toFixed(1)} km`
                : 'Distance unavailable'}
              {' · '}
              {routeSummary.durationMin != null
                ? `~${Math.round(routeSummary.durationMin)} min drive`
                : 'ETA unavailable'}
              {navigating && ' (refreshes as you move)'}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onGetDirections} className="btn-press flex items-center gap-1.5 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-cream">
          <DirectionsIcon className="h-4 w-4" />Get Directions
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
          target="_blank" rel="noreferrer"
          className="btn-press flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <ExternalIcon className="h-4 w-4" />Google Maps
        </a>

        {h.phone ? (
          <a href={tel(h.phone)} className="btn-press flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink">
            <PhoneIcon className="h-4 w-4" />Call
          </a>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/30">
            <PhoneIcon className="h-4 w-4" />Phone not listed
          </span>
        )}
      </div>

      {isRouting && (
        <div className="mt-3">
          {!navigating ? (
            <button onClick={onStart} className="btn-press flex items-center gap-1.5 rounded-full bg-select px-4 py-2 text-sm font-semibold text-white">
              <PlayIcon className="h-3.5 w-3.5" />Start live tracking
            </button>
          ) : (
            <button onClick={onStop} className="btn-press flex items-center gap-1.5 rounded-full border border-select px-4 py-2 text-sm font-semibold text-select">
              <StopIcon className="h-3.5 w-3.5" />Stop live tracking
            </button>
          )}
        </div>
      )}
    </div>
  );
}