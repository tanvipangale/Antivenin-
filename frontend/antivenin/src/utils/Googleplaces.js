import { haversineDistanceKm } from './distance';
import { findRegisteredMatch } from '../data/hospitals';

const GOOGLE_MAPS_SCRIPT_ID = 'antivenin-google-maps-script';
let loadPromise = null;
let placesServiceInstance = null;

export function hasGoogleMapsKey() {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('Timed out waiting for Google Maps to load.'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.onerror = () =>
      reject(new Error('Failed to load Google Maps — check the API key and that billing is enabled.'));
    script.onload = () => {
      if (window.google?.maps?.places) resolve(window.google.maps);
      else reject(new Error('Google Maps loaded but the Places library is missing.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function getPlacesService(googleMaps) {
  if (!placesServiceInstance) {
    // PlacesService needs to be bound to a map instance, even one that's
    // never actually shown on screen.
    const div = document.createElement('div');
    const dummyMap = new googleMaps.Map(div, { center: { lat: 19.076, lng: 72.8777 }, zoom: 12 });
    placesServiceInstance = new googleMaps.places.PlacesService(dummyMap);
  }
  return placesServiceInstance;
}

function nearbySearchOnce(service, googleMaps, location, radius, type) {
  return new Promise((resolve) => {
    service.nearbySearch({ location, radius, type }, (results, status) => {
      // Fail soft per type — zero results for "doctor" shouldn't take down
      // the hospital/pharmacy results too.
      if (status === googleMaps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
}

function mapGoogleType(types = []) {
  if (types.includes('hospital')) return 'hospital';
  if (types.includes('pharmacy')) return 'pharmacy';
  if (types.includes('doctor')) return 'doctor';
  return 'clinic';
}

/**
 * Search Google Places for hospitals, pharmacies, and doctors near a point.
 * Throws if the API key is missing/invalid or the script fails to load —
 * callers should catch this and fall back to fetchOsmHospitals().
 */
export async function fetchGooglePlacesHospitals(lat, lng, radiusMeters = 12000) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('No Google Maps API key configured.');
  }

  const googleMaps = await loadGoogleMaps(apiKey);
  const service = getPlacesService(googleMaps);
  const location = new googleMaps.LatLng(lat, lng);

  const [hospitals, pharmacies, doctors] = await Promise.all([
    nearbySearchOnce(service, googleMaps, location, radiusMeters, 'hospital'),
    nearbySearchOnce(service, googleMaps, location, radiusMeters, 'pharmacy'),
    nearbySearchOnce(service, googleMaps, location, radiusMeters, 'doctor'),
  ]);

  const seen = new Set();
  const mapped = [];

  for (const place of [...hospitals, ...pharmacies, ...doctors]) {
    if (seen.has(place.place_id)) continue;
    seen.add(place.place_id);

    const placeLat = place.geometry?.location?.lat?.();
    const placeLng = place.geometry?.location?.lng?.();
    if (placeLat == null || placeLng == null) continue;

    const name = place.name || 'Unnamed facility';
    const match = findRegisteredMatch(name);

    mapped.push({
      id: `google-${place.place_id}`,
      name,
      address: place.vicinity || 'Address not available',
      phone: null, // a phone number needs a separate Details call — see getPlacePhone()
      placeId: place.place_id,
      type: mapGoogleType(place.types),
      lat: placeLat,
      lng: placeLng,
      source: 'google',
      verified: match?.verified || false,
      stock: match?.stock || null,
      distanceKm: haversineDistanceKm(lat, lng, placeLat, placeLng),
      openNow: place.opening_hours?.open_now ?? null,
      rating: place.rating ?? null,
    });
  }

  mapped.sort((a, b) => a.distanceKm - b.distanceKm);
  return mapped;
}


 // Fetch a phone number for one place on demand 
export async function getPlacePhone(placeId) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !placeId) return null;

  try {
    const googleMaps = await loadGoogleMaps(apiKey);
    const service = getPlacesService(googleMaps);
    return await new Promise((resolve) => {
      service.getDetails({ placeId, fields: ['formatted_phone_number'] }, (result, status) => {
        if (status === googleMaps.places.PlacesServiceStatus.OK && result) {
          resolve(result.formatted_phone_number || null);
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}