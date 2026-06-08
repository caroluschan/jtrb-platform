import { Kuroshiro } from 'kuroshiro-browser';

let interceptorInstalled = false;

function installBrotliInterceptor(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;

  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined' || typeof DecompressionStream === 'undefined') return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input instanceof Request
            ? input.url
            : '';

    if (url.includes('/dict/') && url.endsWith('.br')) {
      const response = await originalFetch(input, init);
      if (!response.ok || !response.body) return response;

      const ds = new DecompressionStream('brotli' as CompressionFormat);
      const decompressedStream = response.body.pipeThrough(ds);
      return new Response(decompressedStream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return originalFetch(input, init);
  };
}

// Regex to match any CJK unified ideograph (kanji) range
const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;

// Regex to strip footnote tags: <f>①</f>, <n>...</n>
const FOOTNOTE_RE = /<\/?[fn][^>]*>/g;

let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<Kuroshiro> | null = null;

const cache = new Map<string, string>();

export function initFurigana(isProd = true): Promise<Kuroshiro> {
  if (kuroshiroInstance) {
    return Promise.resolve(kuroshiroInstance);
  }
  if (initPromise) {
    return initPromise;
  }
  installBrotliInterceptor();
  initPromise = Kuroshiro.buildAndInitWithKuromoji(isProd).then((instance) => {
    kuroshiroInstance = instance;
    return instance;
  });
  return initPromise;
}

function stripFootnotes(text: string): string {
  return text.replace(FOOTNOTE_RE, '');
}

function hasKanji(text: string): boolean {
  return KANJI_RE.test(text);
}

export async function processVerse(kuroshiro: Kuroshiro, text: string): Promise<string> {
  if (!text) return '';

  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  try {
    const cleaned = stripFootnotes(text);

    if (!hasKanji(cleaned)) {
      const result = `<span class="verse-text-plain">${cleaned}</span>`;
      cache.set(text, result);
      return result;
    }

    const result = await kuroshiro.convert(cleaned, {
      to: 'hiragana',
      mode: 'furigana',
    });

    cache.set(text, result);
    return result;
  } catch {
    const fallback = `<span class="verse-text-plain">${stripFootnotes(text)}</span>`;
    cache.set(text, fallback);
    return fallback;
  }
}

export function clearFuriganaCache(): void {
  cache.clear();
}
