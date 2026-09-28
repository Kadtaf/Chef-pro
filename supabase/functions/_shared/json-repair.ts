/**
 * Lenient JSON extraction for LLM answers. Models without a strict JSON mode
 * often wrap the object in markdown fences or a sentence, put raw line breaks
 * inside strings (typical for multi-paragraph article bodies) or leave a
 * trailing comma. Each repair is only attempted when strict parsing fails.
 */

/** Escapes raw control characters that appear inside JSON string literals. */
export function escapeControlCharsInStrings(text: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (!inString) {
      if (char === '"') inString = true;
      out += char;
      continue;
    }
    if (escaped) {
      escaped = false;
      out += char;
    } else if (char === '\\') {
      escaped = true;
      out += char;
    } else if (char === '"') {
      inString = false;
      out += char;
    } else if (char === '\n') {
      out += '\\n';
    } else if (char === '\t') {
      out += '\\t';
    } else if (char !== '\r') {
      out += char;
    }
  }
  return out;
}

const withoutTrailingCommas = (text: string) => text.replace(/,(\s*[}\]])/g, '$1');

/** Parses the JSON object contained in a model answer, repairing common defects. */
export function parseModelJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const sliced = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

  let firstError: unknown;
  for (const text of new Set([cleaned, sliced])) {
    for (const candidate of [
      text,
      escapeControlCharsInStrings(text),
      withoutTrailingCommas(escapeControlCharsInStrings(text)),
    ]) {
      try {
        return JSON.parse(candidate);
      } catch (error) {
        firstError ??= error;
      }
    }
  }
  throw firstError;
}
