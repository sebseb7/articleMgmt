import createCache from '@emotion/cache';

/** Shared Emotion cache config for SSR prerender and client hydration. */
export default function createEmotionCache() {
  return createCache({
    key: 'mui',
    prepend: true,
    speedy: false,
    ...(typeof document !== 'undefined' && {
      insertionPoint: document.querySelector('meta[name="emotion-insertion-point"]') ?? undefined,
    }),
  });
}

/** Copy SSR style tag ids into the client cache before hydration. */
export function prepopulateEmotionCache(cache) {
  if (typeof document === 'undefined') return;

  document.querySelectorAll(`style[data-emotion^="${cache.key} "]`).forEach((tag) => {
    const names = tag.getAttribute('data-emotion')?.slice(cache.key.length + 1);
    if (!names) return;
    names.split(' ').forEach((name) => {
      if (name && cache.inserted[name] === undefined) {
        cache.inserted[name] = true;
      }
    });
  });
}
