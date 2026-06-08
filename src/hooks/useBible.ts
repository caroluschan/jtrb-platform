import { useState, useEffect } from 'preact/hooks';
import type { Database } from 'sql.js';
import type { Book, Verse, MergedVerse } from '../types';
import { getBooks, getMaxChapter, getVerses, mergeVerses } from '../utils/bible';

interface UseBibleReturn {
  books: Book[];
  chapterCount: number;
  verses: MergedVerse[];
  loading: boolean;
  error: string | null;
}

// Get merged book list: pair RCUV and JSS books by book_number
export function getMergedBooks(rcuvDb: Database, jssDb: Database): Book[] {
  const rcuvBooks = getBooks(rcuvDb);
  const jssBooks = getBooks(jssDb);
  const jssMap = new Map(jssBooks.map(b => [b.book_number, b]));
  return rcuvBooks.filter(b => jssMap.has(b.book_number));
}

export function useBible(
  rcuvDb: Database | null,
  jssDb: Database | null,
  bookNumber: number | null,
  chapter: number | null,
): UseBibleReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapterCount, setChapterCount] = useState(0);
  const [verses, setVerses] = useState<MergedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rcuvDb || !jssDb) {
      setLoading(false);
      return;
    }

    try {
      const mergedBooks = getMergedBooks(rcuvDb, jssDb);
      setBooks(mergedBooks);
    } catch (e) {
      setError('Failed to load books: ' + (e as Error).message);
      setLoading(false);
    }
  }, [rcuvDb, jssDb]);

  useEffect(() => {
    if (!rcuvDb || !jssDb || !bookNumber) {
      setLoading(false);
      return;
    }

    try {
      const chCount = getMaxChapter(rcuvDb, bookNumber);
      setChapterCount(chCount);

      if (chapter && chapter > 0) {
        const rcuvVerses = getVerses(rcuvDb, bookNumber, chapter);
        const jssVerses = getVerses(jssDb, bookNumber, chapter);
        const merged = mergeVerses({ jssVerses, rcuvVerses });
        setVerses(merged);
      }
      setLoading(false);
      setError(null);
    } catch (e) {
      setError('Failed to load verses: ' + (e as Error).message);
      setLoading(false);
    }
  }, [rcuvDb, jssDb, bookNumber, chapter]);

  return { books, chapterCount, verses, loading, error };
}
