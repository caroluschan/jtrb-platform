import { useEffect, useState } from 'preact/hooks';
import type { BibleDB } from '../types';
import { loadAllDatabases } from '../utils/db';

type DbState = 'loading' | 'ready' | 'error';

interface UseDatabaseResult {
  state: DbState;
  dbs: BibleDB | null;
  error: string | null;
}

export function useDatabase(): UseDatabaseResult {
  const [state, setState] = useState<DbState>('loading');
  const [dbs, setDbs] = useState<BibleDB | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const databases = await loadAllDatabases();
        if (cancelled) return;
        setDbs(databases);
        setState('ready');
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : 'An unknown error occurred';
        setError(message);
        setState('error');
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  return { state, dbs, error };
}
