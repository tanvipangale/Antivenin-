import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { haversineDistanceKm } from '../utils/distance';

// NOTE: this uses the public OSRM demo server (router.project-osrm.org),
// which is rate-limited and meant for light/evaluation use — it explicitly
// asks callers not to hammer it with continuous requests. For production,
// point this at a real routing backend: a self-hosted OSRM instance,
// Mapbox Directions, or OpenRouteService.
//
// Because of that, this component does NOT recompute the route on every
// GPS tick while navigating. It creates the route once, then only asks
// OSRM for a fresh route when you've moved a meaningful distance or enough
// time has passed — see MIN_REROUTE_METERS / MIN_REROUTE_INTERVAL_MS below.
// The live position marker itself still updates instantly every tick
// (that's just a Leaflet marker move, no network call involved).
const MIN_REROUTE_METERS = 150;
const MIN_REROUTE_INTERVAL_MS = 20000;

export default function RoutingControl({ origin, destination, onRouteFound }) {
  const map = useMap();
  const controlRef = useRef(null);
  const lastRoutedRef = useRef({ lat: null, lng: null, time: 0 });

  // Create (and tear down) the routing control when the destination changes.
  // Deliberately NOT depending on `origin` here — otherwise every GPS tick
  // would destroy and recreate the whole control.
  useEffect(() => {
    if (!map || !origin || !destination) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(origin.lat, origin.lng), L.latLng(destination.lat, destination.lng)],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: '#3E7CB1', weight: 5, opacity: 0.85 }],
      },
      createMarker: () => null, // we render our own custom markers separately
    }).addTo(map);

    control.on('routesfound', (e) => {
      const route = e.routes?.[0];
      if (route && onRouteFound) {
        onRouteFound({
          distanceKm: route.summary.totalDistance / 1000,
          durationMin: route.summary.totalTime / 60,
          updatedAt: Date.now(),
        });
      }
    });

    control.on('routingerror', () => {
      if (onRouteFound) onRouteFound(null);
    });

    controlRef.current = control;
    lastRoutedRef.current = { lat: origin.lat, lng: origin.lng, time: Date.now() };

    return () => {
      map.removeControl(control);
      controlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, destination?.lat, destination?.lng]);

  // As the live position moves, only ask OSRM for a fresh route once we've
  // moved far enough (or enough time has passed) to be worth it. The
  // destination marker/line stay put in between — this is the throttle
  // that keeps continuous "Start" navigation from overloading the free
  // routing server.
  useEffect(() => {
    if (!controlRef.current || !origin || !destination) return;

    const last = lastRoutedRef.current;
    const movedKm = last.lat != null ? haversineDistanceKm(last.lat, last.lng, origin.lat, origin.lng) : Infinity;
    const elapsedMs = Date.now() - last.time;

    if (movedKm * 1000 >= MIN_REROUTE_METERS || elapsedMs >= MIN_REROUTE_INTERVAL_MS) {
      controlRef.current.setWaypoints([L.latLng(origin.lat, origin.lng), L.latLng(destination.lat, destination.lng)]);
      lastRoutedRef.current = { lat: origin.lat, lng: origin.lng, time: Date.now() };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng]);

  return null;
}