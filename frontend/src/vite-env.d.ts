/// <reference types="vite/client" />

interface VanityNumberRuntimeConfig {
  apiEndpoint?: string;
  cognitoAuthority?: string;
  cognitoHostedUiUrl?: string;
  cognitoClientId?: string;
  cognitoRedirectUri?: string;
  cognitoLogoutUri?: string;
}

interface Window {
  VANITY_NUMBER_CONFIG?: VanityNumberRuntimeConfig;
}
