import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PinIcon, SearchIcon, TargetIcon } from './Icons';

export default function LocationSearch({ basePath = '/map-search' }) {
  const [value, setValue] = useState('');
  const [locating, setLocating] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    navigate(`${basePath}?location=${encodeURIComponent(value.trim())}`);
  }

  function handleUseMyLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location detection.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        navigate(`${basePath}?lat=${latitude}&lng=${longitude}`);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Try entering it manually.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6">
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 rounded-full border bg-surface p-2 pl-5 shadow-[0_4px_20px_-8px_rgba(43,42,34,0.18)] transition-all duration-300 ${
          focused ? 'border-select ring-2 ring-select/25' : 'border-ink/10'
        }`}
      >
        <button
          type="button"
          onClick={handleUseMyLocation}
          aria-label="Use my current location"
          className={`btn-press shrink-0 text-clay transition-transform hover:scale-110 disabled:opacity-50 ${
            !value && !locating ? 'locate-pulse' : ''
          }`}
          disabled={locating}
        >
          <PinIcon className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={locating ? 'Finding your location…' : 'Enter your location'}
          className="w-full bg-transparent text-base text-ink placeholder-ink/45 outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="btn-press flex shrink-0 items-center justify-center rounded-full bg-olive p-3 text-cream transition-colors hover:bg-olive-dark"
        >
          <SearchIcon className="h-4.5 w-4.5" />
        </button>
      </form>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        className="btn-press mx-auto mt-3 flex items-center gap-1.5 text-sm font-semibold text-select transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        <TargetIcon className="h-4 w-4" />
        {locating ? 'Locating you…' : 'Or just use my current location'}
      </button>

      {error && <p className="mt-2 text-center text-sm text-warning-text">{error}</p>}
    </div>
  );
}