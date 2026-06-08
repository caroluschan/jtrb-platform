/** Clean RCUV Bible verse text: strip &lt;pb/&gt; page breaks and &lt;e&gt; name tags,
 *  transform &lt;f&gt;X&lt;/f&gt;&lt;n&gt;Y&lt;/n&gt; footnote pairs into (X Y). */
export function cleanRcuvText(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/<pb\/>/g, '');
  cleaned = cleaned.replace(/<f>([^<]*)<\/f>\s*<n>([^<]*)<\/n>/g, '($1 $2)');
  cleaned = cleaned.replace(/<\/?[fn]>/g, '');
  cleaned = cleaned.replace(/<\/?e>/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}
