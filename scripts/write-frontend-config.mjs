import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve(process.env.FRONTEND_CONFIG_PATH ?? 'frontend/dist/config.js');
const dashboardUrl = readRequiredEnv('DASHBOARD_URL');

const config = {
  apiEndpoint: readRequiredEnv('API_ENDPOINT'),
  cognitoAuthority: readRequiredEnv('COGNITO_AUTHORITY'),
  cognitoHostedUiUrl: readRequiredEnv('COGNITO_HOSTED_UI_URL'),
  cognitoClientId: readRequiredEnv('COGNITO_CLIENT_ID'),
  cognitoRedirectUri: dashboardUrl,
  cognitoLogoutUri: dashboardUrl,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `window.VANITY_NUMBER_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  'utf8',
);

function readRequiredEnv(name) {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    throw new Error(`${name} is required to write frontend runtime config.`);
  }

  return value;
}
