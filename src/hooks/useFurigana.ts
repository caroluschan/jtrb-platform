import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { Kuroshiro } from 'kuroshiro-browser';
import { initFurigana, processVerse, clearFuriganaCache } from '../utils/furigana';

interface UseFuriganaReturn {
  processVerse: (text: string) => Promise<string>;
  isReady: boolean;
  error: string | null;
}

export function useFurigana(): UseFuriganaReturn {
  const kuroshiroRef = useRef<Kuroshiro | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    initFurigana(import.meta.env.PROD)
      .then((instance) => {
        if (!cancelled) {
          kuroshiroRef.current = instance;
          setIsReady(true);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError('Failed to initialize furigana: ' + (e as Error).message);
        }
      });

    return () => {
      cancelled = true;
      clearFuriganaCache();
    };
  }, []);

  const process = useCallback(async (text: string): Promise<string> => {
    if (!kuroshiroRef.current) return text;
    try {
      return await processVerse(kuroshiroRef.current, text);
    } catch {
      return text;
    }
  }, []);

  return { processVerse: process, isReady, error };
}
