import type { LatestCallersResponse } from './types';
import { runtimeConfig } from './runtimeConfig';

export const defaultApiEndpoint = runtimeConfig.apiEndpoint;

export async function fetchLatestCallers(
  apiEndpoint: string,
  accessToken?: string,
): Promise<LatestCallersResponse> {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (accessToken !== undefined) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(apiEndpoint, {
    headers,
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
