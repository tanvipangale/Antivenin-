const cache = new Map();

export async function getWikiThumbnail(title) {
  if (cache.has(title)) return cache.get(title);

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return data.thumbnail?.source || data.originalimage?.source || null;
    } catch {
      return null;
    }
  })();

  cache.set(title, promise);
  const result = await promise;
  cache.set(title, result); // replace pending promise with resolved value
  return result;
}