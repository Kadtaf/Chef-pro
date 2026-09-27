/**
 * Pre-commit checks on staged files only.
 * Generated files (Supabase types) are never linted or reformatted.
 */
const GENERATED = /src[\/]shared[\/]types[\/]database\.generated\.ts$/;

const quote = (files) => files.map((file) => `"${file}"`).join(' ');

export default {
  '*.{ts,tsx}': (files) => {
    const sources = files.filter((file) => !GENERATED.test(file));
    if (sources.length === 0) return [];
    return [`eslint --fix --max-warnings 0 --no-warn-ignored ${quote(sources)}`, `prettier --write ${quote(sources)}`];
  },
  '*.{js,json,md,css,html,yml,yaml}': (files) => `prettier --write --ignore-unknown ${quote(files)}`,
};
