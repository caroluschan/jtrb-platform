import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

interface UseVerseAlignOptions {
  leftRef: RefObject<HTMLDivElement>;
  rightRef: RefObject<HTMLDivElement>;
  enabled: boolean;
  /** Changing this triggers re-alignment (e.g., verses reference changes on chapter change) */
  versesKey: unknown;
}

export function useVerseAlign({ leftRef, rightRef, enabled, versesKey }: UseVerseAlignOptions): void {
  const rafId = useRef<number | null>(null);
  const timeoutId = useRef<number | null>(null);

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

      // Clear existing alignment before measuring
      clearAlignment(leftEl, rightEl);

      const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
      const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');

      if (leftVerses.length === 0 || rightVerses.length === 0) {
        // JSS might still be showing spinner — keep retrying
        rafId.current = requestAnimationFrame(tryAlign);
        return;
      }

      // Both panels have verses — align now
      alignVerses(leftEl, rightEl);

      // Schedule periodic re-check to catch DOM changes (e.g., furigana completion)
      timeoutId.current = window.setTimeout(() => {
        rafId.current = requestAnimationFrame(tryAlign);
      }, 300);
    };

    rafId.current = requestAnimationFrame(tryAlign);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [enabled, versesKey]);
}

function clearAlignment(leftEl: HTMLDivElement | null, rightEl: HTMLDivElement | null): void {
  if (!leftEl || !rightEl) return;
  leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
  rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
}

function alignVerses(leftEl: HTMLDivElement, rightEl: HTMLDivElement): void {
  const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
  const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');

  // Build map of verse number → element for each panel
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

  // For each verse in both panels, equalize height
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
