import { execFileSync } from 'node:child_process';

const stackName = process.env.STACK_NAME ?? 'vanity-number-app-dev';
const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const outputs = readStackOutputs();
const apiEndpoint = readOutput(outputs, 'ApiEndpoint');
const dashboardBucket = readOutput(outputs, 'DashboardBucketName');
const dashboardDistributionId = readOutput(outputs, 'DashboardDistributionId');
const dashboardUrl = readOutput(outputs, 'DashboardUrl');
const cognitoAuthority = readOutput(outputs, 'DashboardCognitoAuthority');
const cognitoHostedUiUrl = readOutput(outputs, 'DashboardCognitoHostedUiUrl');
const cognitoClientId = readOutput(outputs, 'DashboardUserPoolClientId');

run(npmCommand, ['run', 'frontend:build']);
run(npmCommand, ['run', 'frontend:write-config'], {
  env: {
    ...process.env,
    API_ENDPOINT: apiEndpoint,
    COGNITO_AUTHORITY: cognitoAuthority,
    COGNITO_HOSTED_UI_URL: cognitoHostedUiUrl,
    COGNITO_CLIENT_ID: cognitoClientId,
    DASHBOARD_URL: dashboardUrl,
  },
});
run('aws', [
  's3',
  'sync',
  'frontend/dist',
  `s3://${dashboardBucket}`,
  '--delete',
  '--region',
  region,
]);
run('aws', [
  'cloudfront',
  'create-invalidation',
  '--distribution-id',
  dashboardDistributionId,
  '--paths',
  '/*',
]);

console.log('');
console.log('Dashboard published successfully.');
console.log(`DashboardUrl: ${dashboardUrl}`);
console.log(`ApiEndpoint: ${apiEndpoint}`);

function readStackOutputs() {
  const rawOutputs = execFileSync(
    'aws',
    [
      'cloudformation',
      'describe-stacks',
      '--stack-name',
      stackName,
      '--region',
      region,
      '--query',
      'Stacks[0].Outputs',
      '--output',
      'json',
    ],
    { encoding: 'utf8' },
  );

  return JSON.parse(rawOutputs);
}

function readOutput(outputs, outputKey) {
  const output = outputs.find((item) => item.OutputKey === outputKey);

  if (output?.OutputValue === undefined || output.OutputValue.trim().length === 0) {
    throw new Error(`CloudFormation output ${outputKey} is missing from ${stackName}.`);
  }

  return output.OutputValue;
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}
