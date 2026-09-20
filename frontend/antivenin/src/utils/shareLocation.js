export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location isn\'t supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location access was denied. Enable it in your browser settings and try again.'));
        } else {
          reject(new Error('Could not get your location. Try again, or read your address off a nearby sign to the dispatcher.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function mapsLink({ lat, lng }) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function shareLocation({ lat, lng }) {
  const link = mapsLink({ lat, lng });
  const text = `This is my exact location right now: ${link}`;

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return { method: 'shared' };
    } catch {
      return { method: 'cancelled' };
    }
  }

  await navigator.clipboard.writeText(text);
  return { method: 'copied', link };
}