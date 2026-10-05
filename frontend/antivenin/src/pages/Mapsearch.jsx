import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HospitalMap from '../components/HospitalMap';
import LocationSearch from '../components/LocationSearch';
import Reveal from '../components/Reveal';
import FacilityCard from '../components/Facilitycard';
import { geocodeLocation, fetchOsmHospitals, retryFetchOsmHospitals, hasAnyStock, byStockThenDistance } from '../utils/hospitalSearch';
import { haversineDistanceKm } from '../utils/distance';
import { StarIcon } from '../components/Icons';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'clinics', label: 'Clinics & doctors' },
  { key: 'stores', label: 'Medical stores' },
];

const SECTIONS = [
  { key: 'hospitals', title: 'Hospitals', types: ['hospital'] },
  { key: 'clinics', title: 'Clinics, doctors & health centres', types: ['clinic', 'doctor', 'health_centre'] },
  { key: 'stores', title: 'Medical stores (pharmacies)', types: ['pharmacy'] },
];

export default function MapSearch() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('idle'); // idle | loading | error | done
  const [center, setCenter] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorReason, setErrorReason] = useState(null);

  const [routingTarget, setRoutingTarget] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [liveOrigin, setLiveOrigin] = useState(null);
  const watchIdRef = useRef(null);

  const locationParam = searchParams.get('location');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  useEffect(() => {
    if (!locationParam && !(latParam && lngParam)) {
      setStatus('idle');
      return;
    }

    let cancelled = false;

    async function run() {
      setStatus('loading');
      setErrorMessage('');
      setErrorReason(null);
      setRoutingTarget(null);
      setRouteSummary(null);
      stopNavigating();

      try {
        let point;
        if (latParam && lngParam) {
          point = { lat: parseFloat(latParam), lng: parseFloat(lngParam) };
        } else {
          point = await geocodeLocation(locationParam);
        }

        if (cancelled) return;
        setCenter(point);

        const results = await fetchOsmHospitals(point.lat, point.lng);
        if (cancelled) return;
        setFacilities(results);
        setStatus('done');
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err.message || 'Something went wrong. Please try again.');
        setErrorReason(err?.reason || null);
        setStatus('error');
      }
    }

    run();
    return () => {
      cancelled = true;
      stopNavigating();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationParam, latParam, lngParam]);

  async function retry() {
    if (!center) return;
    setStatus('loading');
    setErrorMessage('');
    setErrorReason(null);
    try {
      const results = await retryFetchOsmHospitals(center.lat, center.lng);
      setFacilities(results);
      setStatus('done');
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setErrorReason(err?.reason || null);
      setStatus('error');
    }
  }

  function startNavigating() {
    if (!navigator.geolocation) return;
    setNavigating(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setLiveOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setNavigating(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopNavigating() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setNavigating(false);
    setLiveOrigin(null);
  }

  const effectiveOrigin = navigating && liveOrigin ? liveOrigin : center;

  let liveRemainingKm = null;
  let liveEtaMin = null;
  if (navigating && liveOrigin && routingTarget) {
    liveRemainingKm = haversineDistanceKm(liveOrigin.lat, liveOrigin.lng, routingTarget.lat, routingTarget.lng);
    if (routeSummary && routeSummary.distanceKm > 0) {
      const avgKmPerMin = routeSummary.distanceKm / routeSummary.durationMin;
      if (avgKmPerMin > 0) liveEtaMin = liveRemainingKm / avgKmPerMin;
    }
  }

  function cardHandlers(h) {
    const isRouting = routingTarget?.id === h.id;
    return {
      isRouting,
      routeSummary,
      navigating,
      liveRemainingKm: isRouting ? liveRemainingKm : null,
      liveEtaMin: isRouting ? liveEtaMin : null,
      onGetDirections: () => {
        setRoutingTarget(h);
        setRouteSummary(null);
      },
      onStart: startNavigating,
      onStop: stopNavigating,
    };
  }

  // Top 3 hospitals specifically (not clinics/pharmacies) — confirmed stock
  // first, then closest. This is a ranking on top of the full list below,
  // not a replacement for it.
  const topHospitals = [...facilities].filter((f) => f.type === 'hospital' || hasAnyStock(f)).sort(byStockThenDistance).slice(0, 3);
  const topHospitalIds = new Set(topHospitals.map((h) => h.id));

  const activeSections =
    activeFilter === 'all' ? SECTIONS : SECTIONS.filter((s) => s.key === activeFilter);

  // What actually shows on the map — respects the chosen filter tab.
  const visibleOnMap =
    activeFilter === 'all'
      ? facilities
      : facilities.filter((f) => SECTIONS.find((s) => s.key === activeFilter)?.types.includes(f.type));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Map Search</h1>
      <p className="mb-6 text-ink/60">
        Nearby hospitals, clinics, doctors, and pharmacies based on your searched location.
        For just the ones with confirmed antivenom stock, use{' '}
        <a href="/stock" className="font-semibold text-select hover:underline">
          Stock
        </a>{' '}
        instead.
      </p>

      <div className="mb-8">
        <LocationSearch basePath="/map-search" />
      </div>

      {status === 'idle' && (
        <p className="text-center text-ink/60">
          Search a location above, or use your current location, to see nearby facilities on the map.
        </p>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-16 text-ink/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink/20 border-t-olive" />
            <p>Finding nearby healthcare facilities…</p>        </div>
      )}

      {status === 'error' && (
        <div className="mx-auto max-w-md rounded-[14px] border-2 border-ink bg-warning-bg p-6 text-center text-warning-text">
          <p className="mb-4 font-semibold">
            {errorMessage || 'Could not load nearby hospitals. Please try again.'}
          </p>
          <button
            onClick={retry}
            className="btn-press rounded-full bg-clay px-6 py-2 font-semibold text-cream hover:opacity-90"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            {facilities.length === 0 && (
              <p className="text-ink/60">No hospitals, clinics, or pharmacies found nearby. Try a different location.</p>
            )}

            {facilities.length > 0 && (
              <>
                {/* Filter toggle */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`btn-press rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        activeFilter === f.key
                          ? 'bg-olive text-cream'
                          : 'border border-ink/15 bg-surface text-ink/70 hover:bg-ink/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Top 3 hospitals, ranked */}
                {(activeFilter === 'all' || activeFilter === 'hospitals') && (
                  <div className="mb-10">
                    <h2 className="mb-1 flex items-center gap-1.5 text-lg font-semibold text-ink">
                      <StarIcon className="h-4 w-4 text-select" />
                      Top 3 recommended
                    </h2>
                    <p className="mb-4 text-sm text-ink/50">Confirmed antivenom stock first, then distance.</p>
                    {topHospitals.length > 0 ? (
                      <div className="space-y-4">
                        {topHospitals.map((h, index) => (
                          <Reveal key={h.id} delay={index * 60}>
                            <FacilityCard hospital={h} rank={index + 1} {...cardHandlers(h)} />
                          </Reveal>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-[14px] border border-ink/10 bg-surface p-4 text-sm text-ink/50">
                        No hospitals found in this radius — try a nearby city or a larger search area.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {activeSections.map((section) => {
              const items = facilities
                .filter((f) => section.types.includes(f.type))
                .filter((f) => !topHospitalIds.has(f.id));
              if (items.length === 0) return null;

              return (
                <div key={section.key} className="mb-10">
                  <h2 className="mb-1 text-xl font-semibold text-ink">{section.title}</h2>
                  <p className="mb-4 text-sm text-ink/50">
                    {items.length} found · confirmed antivenom stock shown first
                  </p>
                  <div className="space-y-4">
                    {items.map((f, index) => (
                      <Reveal key={f.id} delay={Math.min(index, 6) * 50}>
                        <FacilityCard hospital={f} {...cardHandlers(f)} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-1 h-[420px] overflow-hidden rounded-[14px] border border-ink/10 shadow-sm lg:sticky lg:top-6 lg:order-2 lg:h-[calc(100vh-8rem)]">
            <HospitalMap
              center={effectiveOrigin}
              userIsLive={navigating}
              hospitals={visibleOnMap}
              routingTo={routingTarget}
              onRouteFound={setRouteSummary}
              onSelectForDirections={setRoutingTarget}
            />
          </div>
        </div>
      )}
    </div>
  );
}