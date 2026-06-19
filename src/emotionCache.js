import createCache from '@emotion/cache';

/** Shared Emotion cache config for SSR prerender and client hydration. */
export default function createEmotionCache() {
  return createCache({
    key: 'css',
    prepend: true,
    speedy: false,
    ...(typeof document !== 'undefined' && {
      insertionPoint: document.querySelector('meta[name="emotion-insertion-point"]') ?? undefined,
    }),
  });
}

/** Mark SSR style tags as already inserted so hydration reuses class names. */
export function prepopulateEmotionCache(cache) {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('style[data-emotion]').forEach((tag) => {
    const attr = tag.getAttribute('data-emotion') ?? '';
    if (!attr.startsWith(cache.key)) return;

    let namesPart = attr.slice(cache.key.length);
    if (namesPart.startsWith('-global')) {
      namesPart = `global${namesPart.slice('-global'.length)}`;
    }

    namesPart.trim().split(/\s+/).filter(Boolean).forEach((name) => {
      cache.inserted[name] = true;
    });
  });
}

function stripEmotionStyleTags(html) {
  return html.replace(/<style[^>]*data-emotion[^>]*>[\s\S]*?<\/style>/gi, '');
}

export { stripEmotionStyleTags };
