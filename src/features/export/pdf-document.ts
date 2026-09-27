/**
 * Format-agnostic document model. Features map their entities to a
 * `PdfDocument`; `renderPdf` lays it out with jsPDF (loaded on demand).
 */
export type PdfBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'keyValue'; items: { label: string; value: string }[] }
  | { kind: 'table'; head: string[]; rows: string[][]; align?: ('left' | 'right')[] };

export type PdfSection = { heading: string; blocks: PdfBlock[] };

export type PdfDocument = {
  title: string;
  subtitle?: string;
  badges?: string[];
  imageUrl?: string | null;
  sections: PdfSection[];
  footer?: string;
};

const PAGE = { margin: 48, lineHeight: 1.35 };
type Rgb = [number, number, number];
const COLORS: Record<'primary' | 'text' | 'muted' | 'line', Rgb> = {
  primary: [222, 90, 8],
  text: [39, 39, 42],
  muted: [113, 113, 122],
  line: [228, 228, 231],
};

/** jsPDF standard fonts are WinAnsi: replace characters they cannot render. */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2192]/g, '->')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u0152\u0153\u20AC\n]/g, '');
}

async function loadImage(url: string): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1200 / bitmap.width);
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/jpeg', 0.82), width: canvas.width, height: canvas.height };
  } catch {
    return null; // CORS or decoding failure: export without the picture
  }
}

export async function renderPdf(document: PdfDocument, filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const contentWidth = width - PAGE.margin * 2;
  let y = PAGE.margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > height - PAGE.margin) {
      pdf.addPage();
      y = PAGE.margin;
    }
  };

  const write = (
    text: string,
    options: { size?: number; bold?: boolean; color?: Rgb; x?: number; maxWidth?: number } = {},
  ) => {
    const size = options.size ?? 10;
    pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...(options.color ?? COLORS.text));
    const lines = pdf.splitTextToSize(sanitize(text), options.maxWidth ?? contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(size * PAGE.lineHeight);
      pdf.text(line, options.x ?? PAGE.margin, y + size);
      y += size * PAGE.lineHeight;
    }
  };

  // Header
  write(document.title, { size: 22, bold: true });
  if (document.subtitle) {
    y += 2;
    write(document.subtitle, { size: 11, color: COLORS.muted });
  }
  if (document.badges?.length) {
    y += 4;
    write(document.badges.join('  ·  '), { size: 9, bold: true, color: COLORS.primary });
  }
  y += 10;

  if (document.imageUrl) {
    const image = await loadImage(document.imageUrl);
    if (image) {
      const imageHeight = Math.min(260, (contentWidth * image.height) / image.width);
      const imageWidth = (imageHeight * image.width) / image.height;
      ensureSpace(imageHeight + 12);
      pdf.addImage(image.data, 'JPEG', PAGE.margin, y, imageWidth, imageHeight);
      y += imageHeight + 16;
    }
  }

  for (const section of document.sections) {
    ensureSpace(40);
    y += 8;
    write(section.heading, { size: 14, bold: true, color: COLORS.primary });
    pdf.setDrawColor(...COLORS.line);
    pdf.line(PAGE.margin, y + 2, width - PAGE.margin, y + 2);
    y += 10;

    for (const block of section.blocks) {
      switch (block.kind) {
        case 'paragraph':
          write(block.text);
          y += 6;
          break;
        case 'list':
          block.items.forEach((item, index) => {
            const bullet = block.ordered ? `${index + 1}.` : '•';
            const top = y;
            write(item, { x: PAGE.margin + 18, maxWidth: contentWidth - 18 });
            pdf.setFont('helvetica', 'bold');
            pdf.text(bullet, PAGE.margin, top + 10);
            y += 3;
          });
          y += 4;
          break;
        case 'keyValue': {
          const columnWidth = contentWidth / 2;
          block.items.forEach((item, index) => {
            const column = index % 2;
            if (column === 0) ensureSpace(28);
            const x = PAGE.margin + column * columnWidth;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...COLORS.muted);
            pdf.text(sanitize(item.label), x, y + 8);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(...COLORS.text);
            pdf.text(sanitize(item.value), x, y + 21);
            if (column === 1 || index === block.items.length - 1) y += 30;
          });
          y += 4;
          break;
        }
        case 'table': {
          const columns = block.head.length;
          const firstWidth = contentWidth * (columns > 2 ? 0.4 : 0.6);
          const otherWidth = (contentWidth - firstWidth) / Math.max(1, columns - 1);
          const columnX = (i: number) => PAGE.margin + (i === 0 ? 0 : firstWidth + (i - 1) * otherWidth);
          const columnW = (i: number) => (i === 0 ? firstWidth : otherWidth);

          const drawRow = (cells: string[], header: boolean) => {
            pdf.setFont('helvetica', header ? 'bold' : 'normal');
            pdf.setFontSize(9);
            const wrapped = cells.map((cell, i) => pdf.splitTextToSize(sanitize(cell), columnW(i) - 8) as string[]);
            const rowHeight = Math.max(...wrapped.map((lines) => lines.length)) * 12 + 8;
            ensureSpace(rowHeight);
            if (header) {
              pdf.setFillColor(250, 250, 250);
              pdf.rect(PAGE.margin, y, contentWidth, rowHeight, 'F');
            }
            pdf.setTextColor(...(header ? COLORS.muted : COLORS.text));
            wrapped.forEach((lines, i) => {
              const right = (block.align?.[i] ?? (i === 0 ? 'left' : 'right')) === 'right';
              lines.forEach((line, lineIndex) => {
                const x = right ? columnX(i) + columnW(i) - 4 : columnX(i) + 4;
                pdf.text(line, x, y + 13 + lineIndex * 12, { align: right ? 'right' : 'left' });
              });
            });
            y += rowHeight;
            pdf.setDrawColor(...COLORS.line);
            pdf.line(PAGE.margin, y, width - PAGE.margin, y);
          };

          drawRow(block.head, true);
          block.rows.forEach((row) => drawRow(row, false));
          y += 10;
          break;
        }
      }
    }
  }

  // Footer on every page
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(sanitize(document.footer ?? 'Chef Pro Bordeaux'), PAGE.margin, height - 24);
    pdf.text(`${page} / ${pages}`, width - PAGE.margin, height - 24, { align: 'right' });
  }

  pdf.save(filename);
}
