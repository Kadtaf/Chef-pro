/**
 * HTTP plumbing shared by the AI providers (text and images): timeouts, and
 * short French reasons that the Studio shows when every provider has failed.
 */
/** Error raised by an AI provider; `reason` is shown to the admin if every provider fails. */
export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number | null,
    readonly reason: string,
    /** Start of the provider's response body (never contains our keys), for finer handling. */
    readonly body = '',
  ) {
    super(`${provider}: ${reason}`);
  }
}

/** Short, human reason for common HTTP statuses (shared by providers). */
export function describeStatus(status: number): string {
  if (status === 401 || status === 403) return 'clé refusée';
  if (status === 402) return 'crédits épuisés';
  if (status === 422 || status === 400) return 'demande refusée';
  if (status === 429) return 'quota atteint';
  if (status >= 500) return 'service indisponible';
  return `erreur HTTP ${status}`;
}

/** fetch with a timeout, turning network failures into provider errors. */
export async function providerFetch(provider: string, url: string, init: RequestInit, timeoutMs: number) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    console.error(`${provider} request failed`, error);
    throw new ProviderError(provider, null, 'ne répond pas');
  }
  if (!response.ok) {
    const body = await response.text();
    console.error(`${provider} failed`, response.status, body.slice(0, 500));
    throw new ProviderError(provider, response.status, describeStatus(response.status), body.slice(0, 500));
  }
  return response;
}
