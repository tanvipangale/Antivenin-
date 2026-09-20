import { useState } from 'react';
import { TargetIcon } from './Icons';
import { getCurrentLocation, shareLocation, mapsLink } from '../utils/shareLocation';

export default function ShareLocationButton() {
  const [status, setStatus] = useState('idle'); // idle | loading | error | done
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  async function handleClick() {
    setStatus('loading');
    setMessage('');

    try {
      const coords = await getCurrentLocation();
      const result = await shareLocation(coords);

      if (result.method === 'copied') {
        setLink(result.link);
        setMessage('Location link copied — paste it to whoever you\'re calling or texting.');
      } else if (result.method === 'shared') {
        setMessage('Location shared.');
      }
      setStatus('done');
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="btn-press inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-6 py-4 text-sm font-semibold text-ink hover:bg-ink/5 disabled:opacity-60 print:hidden"
      >
        <TargetIcon className="h-4 w-4" />
        {status === 'loading' ? 'Getting your location…' : 'Share my exact location'}
      </button>

      {message && (
        <p className={`max-w-xs text-center text-xs ${status === 'error' ? 'text-warning-text' : 'text-ink/60'}`}>
          {message}
          {link && (
            <>
              {' '}
              <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-select hover:underline">
                Open link
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}