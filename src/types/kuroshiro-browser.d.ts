declare module 'kuroshiro-browser' {
  interface ConvertOptions {
    to?: 'hiragana' | 'katakana' | 'romaji';
    mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
    romajiSystem?: 'nippon' | 'passport' | 'hepburn';
    delimiter_start?: string;
    delimiter_end?: string;
  }

  interface FuriganaDebug {
    error: (msg: string) => void;
    success: (msg: string) => void;
  }

  interface Util {
    isHiragana(ch: string): boolean;
    isKatakana(ch: string): boolean;
    isKana(ch: string): boolean;
    isKanji(ch: string): boolean;
    isJapanese(ch: string): boolean;
    hasHiragana(str: string): boolean;
    hasKatakana(str: string): boolean;
    hasKana(str: string): boolean;
    hasKanji(str: string): boolean;
    hasJapanese(str: string): boolean;
    kanaToHiragana(str: string): string;
    kanaToKatakana(str: string): string;
    kanaToRomaji(str: string): string;
  }

  export class Kuroshiro {
    static Util: Util;
    static buildAndInitWithKuromoji(isProd?: boolean): Promise<Kuroshiro>;
    convert(text: string, options?: ConvertOptions): Promise<string>;
    getFurigana(text: string, debug?: FuriganaDebug): Promise<string>;
  }

  export class KuroshiroAnalyzerKuromoji {
    init(): Promise<void>;
    parse(str: string): Promise<unknown>;
  }

  export class Kuromoji {
    builder(): unknown;
    dictionaryBuilder(): unknown;
  }
}
