import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import type { Database } from 'sql.js';
import type { Book } from '../types';
import { getBooks, getMaxChapter } from '../utils/bible';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface BookChapterNavProps {
  rcuvDb: Database | null;
  jssDb: Database | null;
  onNavigate: (bookNumber: number, chapter: number) => void;
}

export function BookChapterNav({ rcuvDb, jssDb, onNavigate }: BookChapterNavProps) {
  const [savedBook, setSavedBook] = useLocalStorage<number>('jvc-last-book', 10);
  const [savedChapter, setSavedChapter] = useLocalStorage<number>('jvc-last-chapter', 1);
  const [selectedBook, setSelectedBook] = useState<number>(savedBook);
  const [selectedChapter, setSelectedChapter] = useState<number>(savedChapter);

  // Build merged book list: pair RCUV and JSS names
  const books = useMemo(() => {
    if (!rcuvDb || !jssDb) return [] as (Book & { jssName: string })[];
    const rcuvBooks = getBooks(rcuvDb);
    const jssBooks = getBooks(jssDb);
    const jssMap = new Map(jssBooks.map(b => [b.book_number, b.long_name]));
    return rcuvBooks
      .filter(b => jssMap.has(b.book_number))
      .map(b => ({ ...b, jssName: jssMap.get(b.book_number)! }));
  }, [rcuvDb, jssDb]);

  // Chapter count for selected book
  const [chapterCount, setChapterCount] = useState(0);
  useEffect(() => {
    if (!rcuvDb || !selectedBook) {
      setChapterCount(0);
      return;
    }
    try {
      const count = getMaxChapter(rcuvDb, selectedBook);
      setChapterCount(count);
    } catch {
      setChapterCount(0);
    }
  }, [rcuvDb, selectedBook]);

  // Navigate on mount (restore saved position)
  useEffect(() => {
    if (selectedBook && savedChapter) {
      onNavigate(selectedBook, savedChapter);
    }
  }, []); // only on mount

  // Ensure chapter is valid when chapter count changes
  useEffect(() => {
    if (chapterCount > 0 && selectedChapter > chapterCount) {
      setSelectedChapter(1);
    }
  }, [chapterCount, selectedChapter]);

  const handleBookChange = useCallback((e: Event) => {
    const value = parseInt((e.target as HTMLSelectElement).value);
    setSelectedBook(value);
    setSavedBook(value);
  }, [setSavedBook]);

  const handleChapterChange = useCallback((e: Event) => {
    const value = parseInt((e.target as HTMLSelectElement).value);
    setSelectedChapter(value);
    setSavedChapter(value);
    onNavigate(selectedBook, value);
  }, [onNavigate, selectedBook, setSavedChapter]);

  const chapters = useMemo(() => {
    const options = [];
    for (let i = 1; i <= chapterCount; i++) {
      options.push(<option value={i} key={i}>{i}</option>);
    }
    return options;
  }, [chapterCount]);

  return (
    <div class="nav-group">
      <span class="nav-label">Book</span>
      <select value={selectedBook} onChange={handleBookChange}>
        {books.map(book => (
          <option value={book.book_number} key={book.book_number}>
            {book.long_name} {book.jssName}
          </option>
        ))}
      </select>
      <span class="nav-label">Ch</span>
      <select value={selectedChapter} onChange={handleChapterChange} disabled={chapterCount === 0}>
        {chapters}
      </select>
    </div>
  );
}
