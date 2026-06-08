export function cleanRcuvText(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/<pb\/>/g, '');
  cleaned = cleaned.replace(/<f>([^<]*)<\/f>\s*<n>([^<]*)<\/n>/g, '($1 $2)');
  cleaned = cleaned.replace(/<\/?[fn]>/g, '');
  cleaned = cleaned.replace(/<\/?e>/g, '');
  cleaned = cleaned.replace(/<br\/>/g, '');
  cleaned = cleaned.replace(/<\/?t>/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}
