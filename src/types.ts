export interface Book {
  book_number: number;
  short_name: string;
  long_name: string;
  book_color: string;
}

export interface Verse {
  book_number: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface MergedVerse {
  verse: number;
  jss: string | null;
  rcuv: string | null;
}

export type PanelLanguage = 'jss' | 'rcuv';

export interface BibleDB {
  jss: import('sql.js').Database;
  rcuv: import('sql.js').Database;
}
