import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const stage = readEnv('STAGE', 'dev');
const region = readEnv('AWS_REGION', readEnv('AWS_DEFAULT_REGION', 'us-east-1'));
const stackName = readEnv('STACK_NAME', `vanity-number-app-${stage}`);
const ttlDays = readEnv('TTL_DAYS', '30');
const maxVanityCandidates = readEnv('MAX_VANITY_CANDIDATES', '1000');
const allowedOrigin = readOptionalEnv('ALLOWED_ORIGIN');
const dashboardCallbackUrl = readOptionalEnv('DASHBOARD_CALLBACK_URL');
const dashboardLogoutUrl = readOptionalEnv('DASHBOARD_LOGOUT_URL');
const connectInstanceArn = readOptionalEnv('CONNECT_INSTANCE_ARN');

validateInputs();

console.log(`Deploying ${stackName} to ${region}...`);
console.log('Leave dashboard URL parameters empty to use the generated CloudFront URL.');

run(npmCommand, ['run', 'sam:validate']);
run(npmCommand, ['run', 'sam:build']);

const parameterOverrides = [
  `Stage=${stage}`,
  `TtlDays=${ttlDays}`,
  `MaxVanityCandidates=${maxVanityCandidates}`,
];

pushOptionalParameter(parameterOverrides, 'AllowedOrigin', allowedOrigin);
pushOptionalParameter(parameterOverrides, 'DashboardCallbackUrl', dashboardCallbackUrl);
pushOptionalParameter(parameterOverrides, 'DashboardLogoutUrl', dashboardLogoutUrl);
pushOptionalParameter(parameterOverrides, 'ConnectInstanceArn', connectInstanceArn);

run(resolveSamCommand(), [
  'deploy',
  '--template-file',
  '.aws-sam/build/template.yaml',
  '--stack-name',
  stackName,
  '--region',
  region,
  '--resolve-s3',
  '--capabilities',
  'CAPABILITY_IAM',
  'CAPABILITY_NAMED_IAM',
  '--parameter-overrides',
  ...parameterOverrides,
  '--no-confirm-changeset',
  '--no-fail-on-empty-changeset',
]);

run(npmCommand, ['run', 'frontend:publish'], {
  env: {
    ...process.env,
    AWS_REGION: region,
    STACK_NAME: stackName,
  },
});

console.log('\nDeployment complete.');
console.log(`StackName: ${stackName}`);
console.log(`Region: ${region}`);

function readEnv(name, defaultValue) {
  const value = process.env[name];
  return value === undefined || value.trim().length === 0 ? defaultValue : value.trim();
}

function readOptionalEnv(name) {
  const value = process.env[name];
  return value === undefined || value.trim().length === 0 ? undefined : value.trim();
}

function pushOptionalParameter(parameters, name, value) {
  if (value !== undefined) {
    parameters.push(`${name}=${value}`);
  }
}

function resolveSamCommand() {
  const localSam = resolve(rootDir, '.tools/bin/sam');

  if (existsSync(localSam)) {
    return localSam;
  }

  return process.platform === 'win32' ? 'sam.cmd' : 'sam';
}

function validateInputs() {
  assertMatch('STAGE', stage, /^[a-z0-9-]+$/, 'lowercase letters, numbers, and hyphens');
  assertMatch('AWS_REGION', region, /^[a-z]{2}-[a-z]+-\d$/, 'an AWS region such as us-east-1');
  assertPositiveInteger('TTL_DAYS', ttlDays);
  assertPositiveInteger('MAX_VANITY_CANDIDATES', maxVanityCandidates);

  validateUrl('ALLOWED_ORIGIN', allowedOrigin);
  validateUrl('DASHBOARD_CALLBACK_URL', dashboardCallbackUrl);
  validateUrl('DASHBOARD_LOGOUT_URL', dashboardLogoutUrl);

  if (
    connectInstanceArn !== undefined &&
    !new RegExp(
      `^arn:aws[-a-z0-9]*:connect:${escapeRegExp(region)}:\\d{12}:instance/[-a-zA-Z0-9]+$`,
    ).test(connectInstanceArn)
  ) {
    throw new Error(
      'CONNECT_INSTANCE_ARN must be empty or a Connect instance ARN in the selected region.',
    );
  }
}

function validateUrl(name, value) {
  if (value === undefined) {
    return;
  }

  assertMatch(
    name,
    value,
    /^https?:\/\/[^\s;&|`$]+$/,
    'an http(s) URL without shell metacharacters',
  );
}

function assertPositiveInteger(name, value) {
  assertMatch(name, value, /^[1-9]\d*$/, 'a positive integer');
}

function assertMatch(name, value, pattern, description) {
  if (!pattern.test(value)) {
    throw new Error(`${name} must be ${description}.`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: rootDir, stdio: 'inherit', ...options });
}
