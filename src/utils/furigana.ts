import { Kuroshiro } from 'kuroshiro-browser';

let interceptorInstalled = false;

function installDictInterceptor(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  if (typeof window === 'undefined') return;

  const nativeFetch = window.fetch.bind(window);
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

    if (!url.includes('/dict/') || !url.endsWith('.br')) {
      return nativeFetch(input, init);
    }

    const filename = url.split('/').pop()!;
    const prodUrl = `${window.location.origin}/jtrb-platform/dict/${filename}`;
    const response = await nativeFetch(prodUrl, init);
    if (!response.ok) return response;

    const buffer = await response.arrayBuffer();

    try {
      const ds = new DecompressionStream('brotli' as CompressionFormat);
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(buffer));
      await writer.close();

      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      let total = 0;
      for (const c of chunks) total += c.byteLength;
      const result = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        result.set(c, offset);
        offset += c.byteLength;
      }

      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      return new Response(result, { status: response.status, headers });
    } catch {
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      return new Response(buffer, { status: response.status, headers });
    }
  };
}

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const FOOTNOTE_RE = /<\/?[fn][^>]*>/g;

let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<Kuroshiro> | null = null;

const cache = new Map<string, string>();

export function initFurigana(_isProd?: boolean): Promise<Kuroshiro> {
  if (kuroshiroInstance) {
    return Promise.resolve(kuroshiroInstance);
  }
  if (initPromise) {
    return initPromise;
  }
  installDictInterceptor();
  initPromise = Kuroshiro.buildAndInitWithKuromoji(false).then((instance) => {
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
