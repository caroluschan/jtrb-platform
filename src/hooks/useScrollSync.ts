import { useEffect, useRef } from 'preact/hooks';

/**
 * Synchronizes scroll position between two panels.
 *
 * Uses a direction-aware queue to prevent feedback loops:
 * When a programmatic scrollTop assignment triggers a native scroll event
 * on the target panel, that event is detected and ignored.
 */
export function useScrollSync(
  leftRef: { readonly current: HTMLDivElement | null },
  rightRef: { readonly current: HTMLDivElement | null },
  syncEnabled: boolean,
): void {
  // Tracks which panel(s) had their scrollTop set programmatically.
  // When a scroll event fires for a panel in this set, it's from our own
  // sync operation, not a user gesture, so we ignore it.
  const programmaticScroll = useRef<Set<'left' | 'right'>>(new Set());

  useEffect(() => {
    if (!syncEnabled) return;

    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    const sync = (source: HTMLDivElement, target: HTMLDivElement, sourceSide: 'left' | 'right') => {
      // If this panel had its scrollTop set by us, ignore this event
      if (programmaticScroll.current.has(sourceSide)) {
        programmaticScroll.current.delete(sourceSide);
        return;
      }

      // Mark the target panel — the scroll event it will fire is programmatic
      const targetSide = sourceSide === 'left' ? 'right' : 'left';
      programmaticScroll.current.add(targetSide);
      target.scrollTop = source.scrollTop;
    };

    const onLeftScroll = () => sync(leftEl, rightEl, 'left');
    const onRightScroll = () => sync(rightEl, leftEl, 'right');

    // Attach listeners with a brief delay to let DOM settle after panel mount
    const timer = setTimeout(() => {
      leftEl.addEventListener('scroll', onLeftScroll, { passive: true });
      rightEl.addEventListener('scroll', onRightScroll, { passive: true });
    }, 50);

    return () => {
      clearTimeout(timer);
      leftEl.removeEventListener('scroll', onLeftScroll);
      rightEl.removeEventListener('scroll', onRightScroll);
      programmaticScroll.current.clear();
    };
  }, [syncEnabled]);
}
