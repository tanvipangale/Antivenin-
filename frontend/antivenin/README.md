# Antivenin

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## What's implemented

- **Homepage** (`/`) — matches the Figma layout, with scroll-reveal
  animations, hover-lift cards, and a single location search bar (no more
  duplicate at the bottom — it now links to a "Browse hospitals in Mumbai"
  CTA instead).
- **Emergency** (`/emergency`) — first-aid instructions + Call Emergency
  Services action.
- **Stock** (`/stock`) — defaults to central Mumbai so it's useful even
  before you search. Always shows a curated list of real, verified Mumbai
  hospitals (name, address, phone) merged with live OpenStreetMap data for
  smaller clinics, sorted by distance. If the live OSM fetch is
  unavailable/rate-limited, the page still shows the verified list instead
  of failing.
  - **Directions**: click "Get Directions" for a turn-by-turn route on the
    embedded map (Leaflet + leaflet-routing-machine), or "Open in Google
    Maps" for an external link.
  - **Live navigation**: once routing to a hospital, hit **Start** to track
    your live location (via `watchPosition`) — the map re-centers on you
    and the route updates as you move, like turn-by-turn nav. **Stop**
    ends tracking.
  - **Use current location**: the search bar's 📍 button, plus a labeled
    "Or just use my current location" link, let you skip typing entirely.
  - **Call**: every hospital with a phone number gets a tap-to-call button.
- **About** (`/about`).
- **Login / Register / Dashboard** — in-memory demo auth
  (`src/context/AuthContext.jsx`). Demo login: `stmarys_staff` /
  `demo1234`. Dashboard lets staff adjust quantities or add new antivenom
  types, each stamped with `updatedAt`.

## Animations

Lightweight, premium-feel motion lives in `src/index.css` (`.reveal`,
`.card-lift`, `.btn-press`, `.locate-pulse`, `.page-fade`) plus the
`src/components/Reveal.jsx` scroll-reveal wrapper. All of it respects
`prefers-reduced-motion`.

## Curated Mumbai hospitals

`src/data/mumbaiHospitals.js` holds real, verified hospitals (KEM,
Lilavati, Kokilaben, Sion, Nair, Bombay Hospital) with real addresses and
phone numbers. Their antivenom **stock numbers are demo data** — swap in
real numbers once hospitals register and log into the Dashboard.

## Swapping the logo

The wordmark lives in `src/components/Header.jsx`.

## Known limitations / next steps

- Auth is in-memory only — wire up a real backend before going live, and
  never store plaintext passwords server-side.
- Nominatim/Overpass have public rate limits — fine for development, but
  you'll want your own instance (or a paid provider) at scale.
- The OSRM demo routing server (used by leaflet-routing-machine) is for
  evaluation only — see the comment in `src/components/RoutingControl.jsx`
  for production alternatives.