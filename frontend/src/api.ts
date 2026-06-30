import type { LatestCallersResponse } from './types';

export const defaultApiEndpoint = import.meta.env.VITE_API_ENDPOINT as string | undefined;

export async function fetchLatestCallers(apiEndpoint: string): Promise<LatestCallersResponse> {
  const response = await fetch(apiEndpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const payload = (await response.json()) as LatestCallersResponse;

  if (!Array.isArray(payload.items)) {
    throw new Error('API response is missing items.');
  }

  return payload;
}
