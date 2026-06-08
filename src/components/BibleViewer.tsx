import { useCallback, useRef, useState } from 'preact/hooks';
import { useBible } from '../hooks/useBible';
import { useDatabase } from '../hooks/useDatabase';
import { useScrollSync } from '../hooks/useScrollSync';
import { BiblePanel } from './BiblePanel';
import { BookChapterNav } from './BookChapterNav';
import { ThemeToggle } from './ThemeToggle';

export function BibleViewer() {
  const { state: dbState, dbs, error: dbError } = useDatabase();
  const [bookNumber, setBookNumber] = useState<number | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);

  const { verses, loading: bibleLoading, error: bibleError } = useBible(
    dbs?.rcuv ?? null,
    dbs?.jss ?? null,
    bookNumber,
    chapter,
  );

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const panelsReady =
    dbState === 'ready' && !bibleLoading && verses.length > 0;

  useScrollSync(leftPanelRef, rightPanelRef, panelsReady);

  const handleNavigate = useCallback((book: number, ch: number) => {
    setBookNumber(book);
    setChapter(ch);
  }, []);

  if (dbState === 'loading') {
    return (
      <div class="loading-container">
        <div class="spinner" />
        <div class="loading-text">Loading Bible databases...</div>
      </div>
    );
  }

  if (dbState === 'error') {
    return (
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{dbError ?? 'Failed to load Bible data'}</div>
        <button type="button" class="error-retry" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!dbs) return null;

  return (
    <div class="bible-viewer">
      <header class="header">
        <BookChapterNav
          rcuvDb={dbs.rcuv}
          jssDb={dbs.jss}
          onNavigate={handleNavigate}
        />
        <ThemeToggle />
      </header>
      <div class="panels">
        {bibleLoading ? (
          <>
            <div class="panel">
              <div class="loading-container">
                <div class="spinner" />
                <div class="loading-text">Loading verses...</div>
              </div>
            </div>
            <div class="panel">
              <div class="loading-container">
                <div class="spinner" />
                <div class="loading-text">Loading verses...</div>
              </div>
            </div>
          </>
        ) : bibleError ? (
          <div class="error-container">
            <div class="error-message">{bibleError}</div>
          </div>
        ) : (
          <>
            <BiblePanel ref={leftPanelRef} lang="jss" verses={verses} />
            <BiblePanel ref={rightPanelRef} lang="rcuv" verses={verses} />
          </>
        )}
      </div>
    </div>
  );
}
