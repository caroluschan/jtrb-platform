import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

interface UseVerseAlignOptions {
  leftRef: RefObject<HTMLDivElement>;
  rightRef: RefObject<HTMLDivElement>;
  enabled: boolean;
  versesKey: unknown;
  fontSizeKey: unknown;
}

export function useVerseAlign({ leftRef, rightRef, enabled, versesKey, fontSizeKey }: UseVerseAlignOptions): void {
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      clearAlignment(leftRef.current, rightRef.current);
      return;
    }

    const tryAlign = () => {
      const leftEl = leftRef.current;
      const rightEl = rightRef.current;

      if (!leftEl || !rightEl) {
        rafId.current = requestAnimationFrame(tryAlign);
        return;
      }

      clearAlignment(leftEl, rightEl);

      const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
      const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');

      if (leftVerses.length === 0 || rightVerses.length === 0) {
        rafId.current = requestAnimationFrame(tryAlign);
        return;
      }

      alignVerses(leftEl, rightEl);
    };

    rafId.current = requestAnimationFrame(tryAlign);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [enabled, versesKey, fontSizeKey]);
}

function clearAlignment(leftEl: HTMLDivElement | null, rightEl: HTMLDivElement | null): void {
  if (!leftEl || !rightEl) return;
  leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
  rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
}

function alignVerses(leftEl: HTMLDivElement, rightEl: HTMLDivElement): void {
  const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
  const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');

  const leftMap = new Map<number, HTMLElement>();
  const rightMap = new Map<number, HTMLElement>();

  leftVerses.forEach(el => {
    const v = el.getAttribute('data-verse');
    if (v) leftMap.set(Number(v), el);
  });
  rightVerses.forEach(el => {
    const v = el.getAttribute('data-verse');
    if (v) rightMap.set(Number(v), el);
  });

  for (const [verseNum, leftVerseEl] of leftMap) {
    const rightVerseEl = rightMap.get(verseNum);
    if (!rightVerseEl) continue;

    const leftHeight = leftVerseEl.offsetHeight;
    const rightHeight = rightVerseEl.offsetHeight;
    const maxH = Math.max(leftHeight, rightHeight);

    if (leftHeight < maxH) {
      leftVerseEl.style.minHeight = `${maxH}px`;
    }
    if (rightHeight < maxH) {
      rightVerseEl.style.minHeight = `${maxH}px`;
    }
  }
}
