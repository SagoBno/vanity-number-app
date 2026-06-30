export interface RuntimeConfig {
  apiEndpoint?: string;
  cognitoAuthority?: string;
  cognitoHostedUiUrl?: string;
  cognitoClientId?: string;
  cognitoRedirectUri?: string;
  cognitoLogoutUri?: string;
}

export const runtimeConfig = readRuntimeConfig();

function readRuntimeConfig(): RuntimeConfig {
  const windowConfig = typeof window === 'undefined' ? undefined : window.VANITY_NUMBER_CONFIG;

  const config: RuntimeConfig = {};
  setIfPresent(config, 'apiEndpoint', windowConfig?.apiEndpoint, import.meta.env.VITE_API_ENDPOINT);
  setIfPresent(
    config,
    'cognitoAuthority',
    windowConfig?.cognitoAuthority,
    import.meta.env.VITE_COGNITO_AUTHORITY,
  );
  setIfPresent(
    config,
    'cognitoHostedUiUrl',
    windowConfig?.cognitoHostedUiUrl,
    import.meta.env.VITE_COGNITO_HOSTED_UI_URL,
  );
  setIfPresent(
    config,
    'cognitoClientId',
    windowConfig?.cognitoClientId,
    import.meta.env.VITE_COGNITO_CLIENT_ID,
  );
  setIfPresent(
    config,
    'cognitoRedirectUri',
    windowConfig?.cognitoRedirectUri,
    import.meta.env.VITE_COGNITO_REDIRECT_URI,
  );
  setIfPresent(
    config,
    'cognitoLogoutUri',
    windowConfig?.cognitoLogoutUri,
    import.meta.env.VITE_COGNITO_LOGOUT_URI,
  );

  return config;
}

function firstNonBlank(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim().length > 0);
}

function setIfPresent<Key extends keyof RuntimeConfig>(
  config: RuntimeConfig,
  key: Key,
  ...values: Array<string | undefined>
): void {
  const value = firstNonBlank(...values);

  if (value !== undefined) {
    config[key] = value;
  }
}
