import { haversineDistanceKm } from './distance';
import { supabase } from '../lib/supabase';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GEOCODE_TIMEOUT_MS = 5000;
const DEFAULT_RADIUS_METERS = 25000; // ~city-wide coverage; lower for a tighter search
const CACHE_TTL_MS = 5 * 60 * 1000;
const rawRowCache = new Map();

function withTimeout(promiseFactory, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return promiseFactory(controller.signal).finally(() => clearTimeout(timer));
}

//GEOCODING

export async function geocodeLocation(query) {
  if (!query?.trim()) throw new Error('Please enter a location to search.');

  const url = `${NOMINATIM_URL}?format=json&limit=5&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query.trim())}`;
  let response;
  try {
    response = await withTimeout(
      (signal) => fetch(url, { headers: { Accept: 'application/json' }, signal }),
      GEOCODE_TIMEOUT_MS
    );
  } catch (err) {
    throw new Error(
      err.name === 'AbortError'
        ? 'The location lookup is taking too long. Please try again.'
        : 'Could not reach the location service. Check your connection and try again.'
    );
  }
  if (!response.ok) throw new Error('The location service is unavailable right now.');

  const results = await response.json();
  if (!results?.length) {
    throw new Error(`We couldn't find "${query}". Try a nearby landmark, town, or a more specific address.`);
  }

  const TOO_BROAD = ['state', 'region', 'country'];
  const NARROWER_TYPES = ['city', 'town', 'suburb', 'village', 'municipality'];
  let best = results[0];
  if (TOO_BROAD.includes(best.type)) {
    best = results.slice(1, 4).find((r) => NARROWER_TYPES.includes(r.type)) || best;
  }
  return { lat: parseFloat(best.lat), lng: parseFloat(best.lon), label: best.display_name };
}

//  HELPERS

export function hasAnyStock(hospital) {
  return Boolean(hospital.stock?.some((s) => Number(s.quantity) > 0));
}

export function byStockThenDistance(a, b) {
  const stockScore = (hasAnyStock(b) ? 1 : 0) - (hasAnyStock(a) ? 1 : 0);
  return stockScore !== 0 ? stockScore : a.distanceKm - b.distanceKm;
}

const TYPE_FROM_FACILITY_TYPE = {
  Hospital: 'hospital',
  Clinic: 'clinic',
  Doctor: 'doctor',
  Pharmacy: 'pharmacy',
  'Health Centre': 'health_centre',
};

function cacheKey(lat, lng, radiusMeters) {
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
}

// SUPABASE SEARCH

async function fetchRawRows(lat, lng, radiusMeters) {
  const key = cacheKey(lat, lng, radiusMeters);
  const cached = rawRowCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.rows;

  const radiusKm = radiusMeters / 1000;
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const { data, error } = await supabase
    .from('healthcare_facilities')
    .select(`
      id, source_id, name, facility_type, category, medicine_system, address,
      state, district, subdistrict, town, village, pincode, latitude, longitude,
      phone, mobile, emergency_phone, ambulance_phone, email, website,
      specialties, facilities, accreditation, total_beds, emergency_services, source,
      hospital_stock ( id, name, quantity, updated_at )
    `)
    .gte('latitude', lat - latDelta).lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta).lte('longitude', lng + lngDelta);

  if (error) {
    console.error('[Antivenin] Supabase facility search failed:', error);
    throw new Error('Could not load nearby facilities right now. Please try again.');
  }

  const rows = (data || []).filter((h) => Number.isFinite(Number(h.latitude)) && Number.isFinite(Number(h.longitude)));
  rawRowCache.set(key, { rows, ts: Date.now() });
  return rows;
}

async function fetchDatabaseFacilities(lat, lng, radiusMeters = DEFAULT_RADIUS_METERS) {
  const rows = await fetchRawRows(lat, lng, radiusMeters);
  const radiusKm = radiusMeters / 1000;

  return rows
    .map((h) => {
      const hLat = Number(h.latitude), hLng = Number(h.longitude);
      const distanceKm = haversineDistanceKm(lat, lng, hLat, hLng); // always fresh, never cached
      if (distanceKm > radiusKm) return null;

      const type = TYPE_FROM_FACILITY_TYPE[h.facility_type] || 'clinic';

      return {
        id: `db-${h.id || h.source_id}`,
        databaseId: h.id,
        sourceId: h.source_id,
        name: h.name || 'Unnamed facility',
        address: h.address || [h.town, h.district, h.state, h.pincode].filter(Boolean).join(', ') || 'Address not available',
        phone: h.phone || h.mobile || null,
        amenity: type,
        type,
        lat: hLat,
        lng: hLng,
        source: h.source === 'OpenStreetMap' ? 'osm' : 'supabase',
        verified: h.source !== 'OpenStreetMap', // Government/ABDM-sourced = verified; community-mapped = not
        // Real reported stock from hospital_stock, joined above.
        // No rows -> null, same as "not yet reported".
        stock: h.hospital_stock?.length ? h.hospital_stock : null,
        distanceKm,
        facilityType: h.facility_type,
        category: h.category,
        specialties: h.specialties,
        facilities: h.facilities,
        totalBeds: h.total_beds,
        emergencyServices: h.emergency_services,
        website: h.website,
      };
    })
    .filter(Boolean)
    .sort(byStockThenDistance);
}

// PUBLIC API

export async function fetchOsmHospitals(lat, lng, radiusMeters = DEFAULT_RADIUS_METERS) {
  return fetchDatabaseFacilities(lat, lng, radiusMeters);
}

export async function retryFetchOsmHospitals(lat, lng, radiusMeters = DEFAULT_RADIUS_METERS) {
  rawRowCache.delete(cacheKey(lat, lng, radiusMeters));
  return fetchDatabaseFacilities(lat, lng, radiusMeters);
}

export function getTopRecommendations(hospitals, count = 3) {
  return hospitals.filter((h) => h.type === 'hospital').sort(byStockThenDistance).slice(0, count);
}

export async function fetchAllStockedHospitals() {
  const { data, error } = await supabase
    .from('healthcare_facilities')
    .select(`
      id, name, facility_type, address, state, district, town, pincode,
      latitude, longitude, phone, mobile, source,
      hospital_stock ( id, name, quantity, updated_at )
    `)
    .not('hospital_stock', 'is', null);

  if (error) {
    console.error('[Antivenin] fetchAllStockedHospitals failed:', error);
    return [];
  }

  return (data || [])
    .filter((h) => h.hospital_stock?.some((s) => s.quantity > 0))
    .map((h) => ({
      id: `db-${h.id}`,
      databaseId: h.id,
      name: h.name || 'Unnamed facility',
      address: h.address || [h.town, h.district, h.state, h.pincode].filter(Boolean).join(', ') || 'Address not available',
      phone: h.phone || h.mobile || null,
      type: TYPE_FROM_FACILITY_TYPE[h.facility_type] || 'clinic',
      amenity: TYPE_FROM_FACILITY_TYPE[h.facility_type] || 'clinic',
      lat: Number(h.latitude),
      lng: Number(h.longitude),
      source: h.source === 'OpenStreetMap' ? 'osm' : 'supabase',
      verified: h.source !== 'OpenStreetMap',
      stock: h.hospital_stock,
      distanceKm: null,
    }))
    .sort((a, b) => b.stock.reduce((s, i) => s + i.quantity, 0) - a.stock.reduce((s, i) => s + i.quantity, 0));
}