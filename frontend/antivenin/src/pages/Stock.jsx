import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import HospitalMap from '../components/HospitalMap';
import LocationSearch from '../components/LocationSearch';
import Reveal from '../components/Reveal';
import FacilityCard from '../components/Facilitycard';
import AntivenomLabPanel from '../components/Antivenomlabpanel';

import {
  geocodeLocation,
  fetchOsmHospitals,
  retryFetchOsmHospitals,
  hasAnyStock,
  fetchAllStockedHospitals,
} from '../utils/hospitalSearch';

import { haversineDistanceKm } from '../utils/distance';

export default function Stock() {
  const [params] = useSearchParams();

  const [status, setStatus] = useState('loading');
  const [facilities, setFacilities] = useState([]);
  const [center, setCenter] = useState(null);
  const [target, setTarget] = useState(null);
  const [route, setRoute] = useState(null);
  const [live, setLive] = useState(false);

  const watchRef = useRef(null);

  const location = params.get('location');
  const lat = params.get('lat');
  const lng = params.get('lng');

  useEffect(() => {
    load();
    return () => stopLive();
    // eslint-disable-next-line
  }, [location, lat, lng]);

  async function load(retry = false) {
    setStatus('loading');

    try {
      let data;

      if (location || (lat && lng)) {
        const point =
          lat && lng
            ? { lat: Number(lat), lng: Number(lng) }
            : await geocodeLocation(location);

        setCenter(point);

        data = retry
          ? await retryFetchOsmHospitals(point.lat, point.lng)
          : await fetchOsmHospitals(point.lat, point.lng);
      } else {
        data = await fetchAllStockedHospitals();
      }

      setFacilities((data || []).filter(hasAnyStock));
      setStatus('done');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  function startLive() {
    if (!navigator.geolocation) return;
    setLive(true);
    watchRef.current = navigator.geolocation.watchPosition(
      position => setCenter({ lat: position.coords.latitude, lng: position.coords.longitude }),
      stopLive,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopLive() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setLive(false);
  }

  const remainingDistance =
    live && center && target
      ? haversineDistanceKm(center.lat, center.lng, target.lat, target.lng)
      : null;

  function facilityProps(hospital) {
    return {
      hospital,
      isRouting: target?.id === hospital.id,
      routeSummary: route,
      navigating: live,
      liveRemainingKm: target?.id === hospital.id ? remainingDistance : null,
      onGetDirections: () => { setTarget(hospital); setRoute(null); },
      onStart: startLive,
      onStop: stopLive,
    };
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-24">

      {/* HEADER */}
      <Reveal>
        <header className="mb-8 border-b border-ink/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-olive">Antivenom availability</p>
          <h1 className="mt-2 text-4xl text-ink">Find antivenom stock</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55">
            Hospitals and clinics that have reported confirmed antivenom availability.
          </p>
        </header>
      </Reveal>

      {/* SEARCH BAR — always visible, no hidden toggle */}
      <Reveal>
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-surface p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <LocationSearch basePath="/stock" />
          </div>
          {center && (
            <span className="shrink-0 self-start rounded-full bg-select/10 px-3 py-1.5 text-xs font-semibold text-select sm:self-center">
              Showing results near your search
            </span>
          )}
        </div>
      </Reveal>

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-20 text-ink/60">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink/15 border-t-olive" />
          <p className="text-sm">Checking confirmed stock…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-clay/20 bg-clay/5 p-8 text-center">
          <p className="mb-4 text-sm text-ink/60">We couldn't load the current stock list.</p>
          <button onClick={() => load(true)} className="btn-press rounded-full bg-olive px-6 py-2.5 text-sm font-semibold text-cream hover:bg-olive-dark">
            Try again
          </button>
        </div>
      )}

      {status === 'done' && (
        <section>
          <Reveal>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.14em] text-olive">Across India</p>
                <h2 className="mt-1 text-2xl text-ink">Confirmed stock</h2>
              </div>
              <span className="shrink-0 rounded-full bg-olive/10 px-4 py-2 text-sm font-bold text-olive">
                {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}
              </span>
            </div>
          </Reveal>

          {facilities.length > 0 ? (
            <>
              <Reveal><AntivenomLabPanel facilities={facilities} /></Reveal>

              <div className={`mt-7 grid gap-7 ${center ? 'lg:grid-cols-2' : ''}`}>
                <div className={`space-y-4 overflow-y-auto pr-1 ${center ? 'max-h-[640px] lg:max-h-[560px]' : ''}`}>
                  {facilities.map((hospital, index) => (
                    <Reveal key={hospital.id} delay={Math.min(index, 5) * 50}>
                      <FacilityCard {...facilityProps(hospital)} />
                    </Reveal>
                  ))}
                </div>

                {center && (
                  <div className="h-[430px] overflow-hidden rounded-2xl border border-ink/10 lg:sticky lg:top-6 lg:h-[560px]">
                    <HospitalMap
                      center={center}
                      userIsLive={live}
                      hospitals={facilities}
                      routingTo={target}
                      onRouteFound={setRoute}
                      onSelectForDirections={setTarget}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <Reveal>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-ink/10 bg-surface px-8 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-xl">💊</span>
                <p className="font-semibold text-ink">No confirmed antivenom stock reported here yet</p>
                <p className="max-w-sm text-sm text-ink/55">
                  Try a nearby city, or check{' '}
                  <a href="/map-search" className="font-semibold text-select hover:underline">Map Search</a>{' '}
                  to see every hospital and clinic nearby, regardless of stock.
                </p>
              </div>
            </Reveal>
          )}
        </section>
      )}
    </main>
  );
}