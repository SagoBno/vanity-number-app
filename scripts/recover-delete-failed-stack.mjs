import { execFileSync } from 'node:child_process';

const stackName = process.env.STACK_NAME ?? 'vanity-number-app-dev';
const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
const stage = process.env.STAGE ?? stackName.replace(/^vanity-number-app-/, '');

const stackStatus = readStackStatus();

if (stackStatus === undefined) {
  console.log(`No existing stack named ${stackName}.`);
  process.exit(0);
}

if (stackStatus !== 'DELETE_FAILED') {
  console.log(`Existing stack ${stackName} is ${stackStatus}; no delete recovery needed.`);
  process.exit(0);
}

if (stage === 'prod' && process.env.ALLOW_PROD_STACK_RECOVERY !== 'true') {
  throw new Error(
    `Stack ${stackName} is DELETE_FAILED. Refusing to empty dashboard bucket for prod without ALLOW_PROD_STACK_RECOVERY=true.`,
  );
}

console.log(`Stack ${stackName} is DELETE_FAILED. Attempting dashboard bucket recovery...`);

const dashboardBucket = readDashboardBucketName();

if (dashboardBucket !== undefined) {
  console.log(`Emptying dashboard bucket ${dashboardBucket}...`);
  run('aws', ['s3', 'rm', `s3://${dashboardBucket}`, '--recursive', '--region', region]);
} else {
  console.log('No DashboardBucket resource found; retrying stack delete without bucket cleanup.');
}

console.log(`Deleting stack ${stackName}...`);
run('aws', ['cloudformation', 'delete-stack', '--stack-name', stackName, '--region', region]);

console.log(`Waiting for ${stackName} deletion to complete...`);
run('aws', [
  'cloudformation',
  'wait',
  'stack-delete-complete',
  '--stack-name',
  stackName,
  '--region',
  region,
]);

console.log(`Recovered ${stackName}; stack was deleted successfully.`);

function readStackStatus() {
  try {
    return execFileSync(
      'aws',
      [
        'cloudformation',
        'describe-stacks',
        '--stack-name',
        stackName,
        '--region',
        region,
        '--query',
        'Stacks[0].StackStatus',
        '--output',
        'text',
      ],
      { encoding: 'utf8' },
    ).trim();
  } catch (error) {
    if (String(error.stderr ?? error.message).includes('does not exist')) {
      return undefined;
    }

    throw error;
  }
}

function readDashboardBucketName() {
  const bucketName = execFileSync(
    'aws',
    [
      'cloudformation',
      'describe-stack-resources',
      '--stack-name',
      stackName,
      '--region',
      region,
      '--query',
      "StackResources[?LogicalResourceId=='DashboardBucket'].PhysicalResourceId | [0]",
      '--output',
      'text',
    ],
    { encoding: 'utf8' },
  ).trim();

  return bucketName === 'None' || bucketName.length === 0 ? undefined : bucketName;
}

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}
