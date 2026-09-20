import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import RoutingControl from './RoutingControl';

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:3px solid #FDFBF6;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

// Marker color by facility type, plus the user's own location.
const USER_ICON = pinIcon('#E53935'); // red
const TYPE_ICONS = {
  hospital: pinIcon('#2F9E44'), // green
  clinic: pinIcon('#1971C2'), // blue
  health_centre: pinIcon('#1971C2'), // blue (grouped with clinics)
  doctor: pinIcon('#9C36B5'), // purple
  pharmacy: pinIcon('#E8590C'), // orange
};

const TYPE_LABEL = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  health_centre: 'Health Centre',
  doctor: "Doctor's office",
  pharmacy: 'Pharmacy / medical shop',
};

function iconForType(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.clinic;
}

function Recenter({ lat, lng, live }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      if (live) {
        map.panTo([lat, lng], { animate: true });
      } else {
        map.setView([lat, lng], map.getZoom() < 12 ? 13 : map.getZoom());
      }
    }
  }, [lat, lng, live, map]);
  return null;
}

export default function HospitalMap({
  center,
  hospitals,
  routingTo,
  onRouteFound,
  onSelectForDirections,
  userIsLive = false,
}) {
  const mapRef = useRef(null);

  if (!center) return null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', borderRadius: '14px' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} live={userIsLive} />

      <Marker position={[center.lat, center.lng]} icon={USER_ICON}>
        <Popup>{userIsLive ? 'Your live location' : 'Your location'}</Popup>
      </Marker>

      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={iconForType(h.type)}>
          <Popup>
            <div className="max-w-[240px]">
              <p className="font-semibold">{h.name}</p>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {TYPE_LABEL[h.type] || 'Clinic'}
              </p>
              <p className="mt-1 text-sm text-gray-600">{h.address}</p>
              {h.phone && (
                <p className="mt-1 text-sm">
                  <a href={`tel:${h.phone.replace(/[^\d+]/g, '')}`} className="text-blue-600">
                    {h.phone}
                  </a>
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600">{h.distanceKm?.toFixed(1)} km away</p>
              <p className="mt-1 text-sm">
                {h.stock
                  ? h.stock.map((s) => `${s.name}: ${s.quantity}`).join(', ')
                  : 'Stock not yet reported'}
              </p>
              <button
                onClick={() => onSelectForDirections?.(h)}
                className="mt-2 rounded-full bg-[#6E6B47] px-3 py-1 text-xs font-semibold text-white"
              >
                Get Directions
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {routingTo && <RoutingControl origin={center} destination={routingTo} onRouteFound={onRouteFound} />}
    </MapContainer>
  );
}