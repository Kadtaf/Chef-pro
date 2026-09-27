/**
 * Minimal, safe rich-text renderer for editorial content written in the
 * back-office. Supported syntax: "## " / "### " headings, "- " bullet lists,
 * "1. " ordered lists, blank-line separated paragraphs and **bold**.
 * Content is rendered as React text nodes: no HTML is ever injected.
 */
export type RichBlock = { type: 'h2' | 'h3' | 'p'; text: string } | { type: 'ul' | 'ol'; items: string[] };

export function parseRichText(source: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  let paragraph: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    if (list) blocks.push(list);
    paragraph = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (!line) {
      flush();
    } else if (line.startsWith('### ')) {
      flush();
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (bullet || ordered) {
      const type = bullet ? 'ul' : 'ol';
      if (paragraph.length || (list && list.type !== type)) flush();
      list ??= { type, items: [] };
      list.items.push((bullet ?? ordered)![1]!);
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
