function base(props) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  };
}

export function PinIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function TargetIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function PhoneIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M4 5c0-.6.4-1 1-1h2.4c.5 0 .9.3 1 .8l.8 3a1 1 0 0 1-.3 1L7.5 10a11 11 0 0 0 6.5 6.5l1.2-1.4a1 1 0 0 1 1-.3l3 .8c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1C9.6 20 4 14.4 4 7V6z" />
    </svg>
  );
}

export function DirectionsIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M4 11l7-7 9 9-7 7-9-9z" />
      <path d="M9 6v4h4" />
    </svg>
  );
}

export function ExternalIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4L10 14" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function PlayIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function StopIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function HospitalIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <rect x="4" y="4" width="16" height="17" rx="1.5" />
      <path d="M12 8v6M9 11h6" />
      <path d="M4 21h16" />
    </svg>
  );
}

export function PillIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M9.5 9.5l5 5" />
    </svg>
  );
}

export function StethoscopeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M6 4v6a4 4 0 0 0 8 0V4" />
      <path d="M10 14v2a5 5 0 0 0 10 0v-1.5" />
      <circle cx="20" cy="12.5" r="1.6" />
    </svg>
  );
}

export function DownloadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function PrinterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M6 9V4h12v5" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

export function VialIcon({ className = 'h-6 w-6', fillPercent = 0 }) {
  const clampedFill = Math.max(0, Math.min(100, fillPercent));
  const liquidHeight = 13 * (clampedFill / 100);
  const liquidY = 19 - liquidHeight;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`vial-clip-${Math.round(clampedFill)}`}>
          <path d="M9 3h6v4.5l2.2 8A3 3 0 0 1 14.3 19H9.7a3 3 0 0 1-2.9-3.5l2.2-8V3z" />
        </clipPath>
      </defs>
      <rect
        x="7"
        y={liquidY}
        width="10"
        height={liquidHeight}
        fill="currentColor"
        opacity="0.85"
        clipPath={`url(#vial-clip-${Math.round(clampedFill)})`}
      />
      <path
        d="M9 3h6v4.5l2.2 8A3 3 0 0 1 14.3 19H9.7a3 3 0 0 1-2.9-3.5l2.2-8V3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 3h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SnakeSilhouette({ className = 'h-6 w-6' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <path d="M4 6c2-2 5-2 6 0s-1 4 1 5 4-2 6-1 2 4 0 6-5 2-6 0" />
      <circle cx="5" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ScorpionSilhouette({ className = 'h-6 w-6' }) {
  return (
    <svg {...base({ className })} aria-hidden="true">
      <ellipse cx="10" cy="13" rx="5" ry="3.2" />
      <path d="M15 12c2-1 3-3 2-5" />
      <path d="M17 7c1-1 2-1 2.5 0" />
      <path d="M5 11l-2-1M5 15l-2 1M9 16l-1 2M13 16l1 2" />
    </svg>
  );
}

export function StarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6l-6.2 3.6 1.6-6.9-5.3-4.7 7-.7z" />
    </svg>
  );
}