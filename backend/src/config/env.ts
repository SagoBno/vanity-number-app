import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';
import { DEFAULT_MAX_VANITY_CANDIDATES, DEFAULT_TTL_DAYS } from './constants';

export interface AppConfig {
  allowedOrigin: string;
  maxVanityCandidates: number;
  tableName: string;
  ttlDays: number;
}

interface ParameterStoreConfig {
  allowedOrigin?: string;
  maxVanityCandidates?: number;
  ttlDays?: number;
}

const ssmClient = new SSMClient({});
const cachedParameterStoreConfigs = new Map<string, ParameterStoreConfig>();

export async function getConfig(): Promise<AppConfig> {
  const envConfig = getEnvConfig();
  const parameterPath = process.env.CONFIG_PARAMETER_PATH;

  if (parameterPath === undefined || parameterPath.trim().length === 0) {
    return envConfig;
  }

  const parameterStoreConfig = await getParameterStoreConfig(parameterPath);

  return {
    ...envConfig,
    ...parameterStoreConfig,
  };
}

function getEnvConfig(): AppConfig {
  return {
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
    maxVanityCandidates: readPositiveInteger(
      process.env.MAX_VANITY_CANDIDATES,
      DEFAULT_MAX_VANITY_CANDIDATES,
    ),
    tableName: process.env.TABLE_NAME ?? 'VanityNumbers-local',
    ttlDays: readPositiveInteger(process.env.TTL_DAYS, DEFAULT_TTL_DAYS),
  };
}

async function getParameterStoreConfig(parameterPath: string): Promise<ParameterStoreConfig> {
  const normalizedPath = normalizeParameterPath(parameterPath);
  const cachedConfig = cachedParameterStoreConfigs.get(normalizedPath);

  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const config = await readParameterStoreConfig(normalizedPath);
  cachedParameterStoreConfigs.set(normalizedPath, config);
  return config;
}

async function readParameterStoreConfig(parameterPath: string): Promise<ParameterStoreConfig> {
  const values = new Map<string, string>();
  let nextToken: string | undefined;

  do {
    const response = await ssmClient.send(
      new GetParametersByPathCommand({
        Path: parameterPath,
        Recursive: false,
        WithDecryption: true,
        NextToken: nextToken,
      }),
    );

    for (const parameter of response.Parameters ?? []) {
      if (parameter.Name !== undefined && parameter.Value !== undefined) {
        values.set(parameter.Name.slice(parameterPath.length + 1), parameter.Value);
      }
    }

    nextToken = response.NextToken;
  } while (nextToken !== undefined);

  const config: ParameterStoreConfig = {};
  const allowedOrigin = values.get('allowed-origin');
  const maxVanityCandidates = readOptionalPositiveInteger(values.get('max-vanity-candidates'));
  const ttlDays = readOptionalPositiveInteger(values.get('ttl-days'));

  if (allowedOrigin !== undefined) {
    config.allowedOrigin = allowedOrigin;
  }

  if (maxVanityCandidates !== undefined) {
    config.maxVanityCandidates = maxVanityCandidates;
  }

  if (ttlDays !== undefined) {
    config.ttlDays = ttlDays;
  }

  return config;
}

function normalizeParameterPath(parameterPath: string): string {
  return parameterPath.endsWith('/') ? parameterPath.slice(0, -1) : parameterPath;
}

function readOptionalPositiveInteger(rawValue: string | undefined): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  if (!isIntegerString(rawValue)) {
    return undefined;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function readPositiveInteger(rawValue: string | undefined, fallback: number): number {
  if (rawValue === undefined) {
    return fallback;
  }

  if (!isIntegerString(rawValue)) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isIntegerString(rawValue: string): boolean {
  return /^[1-9]\d*$/.test(rawValue.trim());
}
