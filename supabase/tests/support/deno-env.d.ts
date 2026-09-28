/** Minimal Deno surface used by the shared edge-function modules tested under Node. */
declare const Deno: { env: { get(name: string): string | undefined } };
