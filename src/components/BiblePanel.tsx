import { forwardRef } from 'preact/compat';
import { useMemo, useEffect, useState } from 'preact/hooks';
import type { MergedVerse } from '../types';
import { useFurigana } from '../hooks/useFurigana';
import { cleanRcuvText } from '../utils/cleanText';

interface BiblePanelProps {
  lang: 'jss' | 'rcuv';
  verses: MergedVerse[];
}

export const BiblePanel = forwardRef<HTMLDivElement, BiblePanelProps>(
  ({ lang, verses }, ref) => {
    const [processedHtml, setProcessedHtml] = useState<Record<number, string>>({});
    const [processing, setProcessing] = useState(false);
    const { processVerse, isReady: furiganaReady } = useFurigana();

    // Process furigana for JSS verses
    useEffect(() => {
      if (lang !== 'jss' || !furiganaReady || verses.length === 0) return;

      let cancelled = false;
      setProcessing(true);

      const process = async () => {
        const results: Record<number, string> = {};
        // Process in batches to avoid blocking the UI
        const batchSize = 10;
        for (let i = 0; i < verses.length; i += batchSize) {
          if (cancelled) break;
          const batch = verses.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (v) => {
              try {
                const html = await processVerse(v.jss ?? '');
                return [v.verse, html] as const;
              } catch {
                return [v.verse, v.jss ?? ''] as const;
              }
            })
          );
          for (const [verse, html] of batchResults) {
            results[verse] = html;
          }
        }
        if (!cancelled) {
          setProcessedHtml(results);
          setProcessing(false);
        }
      };

      process();
      return () => { cancelled = true; };
    }, [lang, verses, furiganaReady, processVerse]);

    const renderedVerses = useMemo(() => {
      return verses.map(v => (
        <div class="verse" data-verse={v.verse} key={v.verse}>
          <span class="verse-num">{v.verse}</span>
          <span class="verse-text">
            {lang === 'jss' ? (
              v.jss ? (
                <span dangerouslySetInnerHTML={{ __html: processedHtml[v.verse] ?? v.jss }} />
              ) : (
                <span class="verse-missing">—</span>
              )
            ) : (
              v.rcuv ? (
                <span>{cleanRcuvText(v.rcuv)}</span>
              ) : (
                <span class="verse-missing">—</span>
              )
            )}
          </span>
        </div>
      ));
    }, [verses, lang, processedHtml]);

    if (processing && lang === 'jss') {
      return (
        <div class="panel" ref={ref}>
          <div class="loading-container">
            <div class="spinner" />
            <div class="loading-text">Processing furigana...</div>
          </div>
        </div>
      );
    }

    return (
      <div class="panel" ref={ref}>
        {renderedVerses}
      </div>
    );
  }
);
