import { UserManager, type User, type UserManagerSettings } from 'oidc-client-ts';
import { runtimeConfig } from './runtimeConfig';

export interface AuthConfig {
  authority: string;
  hostedUiUrl?: string;
  clientId: string;
  redirectUri: string;
  logoutUri: string;
}

export interface AuthSession {
  accessToken: string;
  email: string | null;
}

const authority = runtimeConfig.cognitoAuthority;
const hostedUiUrl = runtimeConfig.cognitoHostedUiUrl;
const clientId = runtimeConfig.cognitoClientId;
const redirectUri = runtimeConfig.cognitoRedirectUri;
const logoutUri = runtimeConfig.cognitoLogoutUri;

export const authConfig = readAuthConfig();
const userManager = authConfig === null ? null : new UserManager(toUserManagerSettings(authConfig));

export function isAuthConfigured(): boolean {
  return authConfig !== null;
}

export async function completeSignInIfNeeded(): Promise<AuthSession | null> {
  if (userManager === null) {
    return null;
  }

  const callbackParams = new URLSearchParams(window.location.search);

  if (callbackParams.has('error')) {
    const error = callbackParams.get('error') ?? 'unknown_error';
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Sign in failed: ${error}`);
  }

  if (callbackParams.has('code') && callbackParams.has('state')) {
    const user = await userManager.signinRedirectCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
    return toAuthSession(user);
  }

  const user = await userManager.getUser();
  return toAuthSession(user);
}

export async function signIn(): Promise<void> {
  if (userManager === null) {
    return;
  }

  await userManager.signinRedirect();
}

export async function signOut(): Promise<void> {
  if (userManager === null) {
    return;
  }

  await userManager.signoutRedirect();
}

function readAuthConfig(): AuthConfig | null {
  if (isBlank(authority) || isBlank(clientId) || isBlank(redirectUri) || isBlank(logoutUri)) {
    return null;
  }

  return {
    authority,
    ...(isBlank(hostedUiUrl) ? {} : { hostedUiUrl: removeTrailingSlash(hostedUiUrl) }),
    clientId,
    redirectUri,
    logoutUri,
  };
}

function toUserManagerSettings(config: AuthConfig): UserManagerSettings {
  const settings: UserManagerSettings = {
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    post_logout_redirect_uri: config.logoutUri,
    response_type: 'code',
    scope: 'openid email profile',
    automaticSilentRenew: false,
    loadUserInfo: true,
  };

  if (config.hostedUiUrl !== undefined) {
    settings.metadataSeed = {
      authorization_endpoint: `${config.hostedUiUrl}/oauth2/authorize`,
      token_endpoint: `${config.hostedUiUrl}/oauth2/token`,
      userinfo_endpoint: `${config.hostedUiUrl}/oauth2/userInfo`,
      end_session_endpoint: `${config.hostedUiUrl}/logout`,
      revocation_endpoint: `${config.hostedUiUrl}/oauth2/revoke`,
    };
  }

  return settings;
}

function toAuthSession(user: User | null): AuthSession | null {
  if (user === null || user.expired === true) {
    return null;
  }

  return {
    accessToken: user.access_token,
    email: typeof user.profile.email === 'string' ? user.profile.email : null,
  };
}

function isBlank(value: string | undefined): value is undefined {
  return value === undefined || value.trim().length === 0;
}

function removeTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
