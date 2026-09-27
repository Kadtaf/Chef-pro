export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const BOM = String.fromCharCode(0xfeff);

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Semicolon-separated CSV (French Excel) with a BOM so UTF-8 opens correctly. */
export function toCsv(rows: Record<string, unknown>[]): Blob {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: unknown) => {
    const text = cellText(value);
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.join(';'), ...rows.map((row) => headers.map((h) => escape(row[h])).join(';'))];
  return new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
}
