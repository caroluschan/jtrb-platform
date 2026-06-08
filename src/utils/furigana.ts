import { Kuroshiro } from 'kuroshiro-browser';
import brotliWasmPromise from 'brotli-wasm';

let brotliWasmModule: Awaited<typeof brotliWasmPromise> | null = null;

async function getBrotliWasm() {
  if (!brotliWasmModule) {
    brotliWasmModule = await brotliWasmPromise;
  }
  return brotliWasmModule;
}

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const FOOTNOTE_RE = /<\/?[fn][^>]*>/g;

let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<Kuroshiro> | null = null;

const cache = new Map<string, string>();

let interceptorInstalled = false;

function installDictInterceptor(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  if (typeof window === 'undefined') return;
  if (window.location.hostname === 'localhost') return;

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

    const response = await nativeFetch(input, init);
    if (!response.ok) return response;

    const buffer = await response.arrayBuffer();

    try {
      const wasm = await getBrotliWasm();
      const decompressed = wasm.decompress(new Uint8Array(buffer));
      if (!decompressed) throw new Error('brotli decompression returned null');

      const result = new Uint8Array(
        decompressed.buffer,
        decompressed.byteOffset,
        decompressed.byteLength,
      );
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      return new Response(result as unknown as BodyInit, {
        status: response.status,
        headers,
      });
    } catch {
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      return new Response(buffer, {
        status: response.status,
        headers,
      });
    }
  };
}

export function initFurigana(_isProd?: boolean): Promise<Kuroshiro> {
  if (kuroshiroInstance) {
    return Promise.resolve(kuroshiroInstance);
  }
  if (initPromise) {
    return initPromise;
  }
  installDictInterceptor();
  initPromise = Kuroshiro.buildAndInitWithKuromoji(true).then((instance) => {
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
