import { Database } from 'sql.js';
import type { Book, Verse, MergedVerse } from '../types';

// Get all books with names from a DB
export function getBooks(db: Database): Book[] {
  const result = db.exec(
    'SELECT book_color, book_number, short_name, long_name FROM books ORDER BY book_number'
  );
  if (!result.length || !result[0].values.length) return [];
  return result[0].values.map((row) => ({
    book_color: row[0] as string,
    book_number: row[1] as number,
    short_name: row[2] as string,
    long_name: row[3] as string,
  }));
}

// Find the maximum chapter for a given book
export function getMaxChapter(db: Database, bookNumber: number): number {
  const result = db.exec('SELECT MAX(chapter) FROM verses WHERE book_number = ?', [bookNumber]);
  if (!result.length || !result[0].values.length || result[0].values[0][0] === null) return 0;
  return result[0].values[0][0] as number;
}

// Get all verses for a book+chapter
export function getVerses(db: Database, bookNumber: number, chapter: number): Verse[] {
  const result = db.exec(
    'SELECT book_number, chapter, verse, text FROM verses WHERE book_number = ? AND chapter = ? AND verse > 0 ORDER BY verse',
    [bookNumber, chapter]
  );
  if (!result.length || !result[0].values.length) return [];
  return result[0].values.map((row) => ({
    book_number: row[0] as number,
    chapter: row[1] as number,
    verse: row[2] as number,
    text: row[3] as string,
  }));
}

// Build a Map<verseNumber, text> for fast lookup
export function buildVerseMap(verses: Verse[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const v of verses) {
    map.set(v.verse, v.text);
  }
  return map;
}

// Merge JSS and RCUV verses: union of all verse numbers, null where missing
export function mergeVerses(
  { jssVerses, rcuvVerses }: { jssVerses: Verse[]; rcuvVerses: Verse[] }
): MergedVerse[] {
  const jssMap = buildVerseMap(jssVerses);
  const rcuvMap = buildVerseMap(rcuvVerses);

    const allVerses = new Set<number>();
  for (const v of jssVerses) allVerses.add(v.verse);
  for (const v of rcuvVerses) allVerses.add(v.verse);

  return Array.from(allVerses)
    .sort((a, b) => a - b)
    .map((verse) => ({
      verse,
      jss: jssMap.get(verse) ?? null,
      rcuv: rcuvMap.get(verse) ?? null,
    }));
}
