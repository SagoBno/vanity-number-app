# AWS Deployment Guide

This guide describes the AWS setup required to deploy the Vanity Number App with AWS SAM.

## Deployment Model

The project uses two permission layers:

- **Deployment permissions**: permissions used by the IAM principal running `sam deploy`. These permissions create and update CloudFormation, Lambda, DynamoDB, API Gateway, IAM, KMS, SSM Parameter Store, CloudWatch Logs, and S3 deployment artifacts.
- **Runtime permissions**: permissions used by the deployed Lambda functions. These are defined in `backend/template.yaml` and are scoped to the resources each function needs.

The Lambda runtime roles are intentionally narrower than the deployment role:

- `generateVanityNumbers` can write caller records to DynamoDB and use the table KMS key.
- `getLastCallers` can query the DynamoDB table/GSI and use the table KMS key.
- Both Lambdas can read runtime configuration from the scoped SSM parameter path.

## Recommended Region

The validated deployment used:

```txt
us-east-1
```

Amazon Connect must be created in the same AWS account and region as the Lambda function it invokes.

## Local Tooling

Required tools:

```bash
aws --version
sam --version
node --version
npm --version
```

Configure AWS credentials:

```bash
aws configure
```

Verify the active caller identity:

```bash
aws sts get-caller-identity
```

## Deployment Policy

The following policy is suitable for a sandbox deployment account for this assignment. The policy includes infrastructure deployment actions and post-deploy validation actions such as invoking Lambda and reading logs.

For production, split this into narrower policies. In particular, scope `iam:PassRole` to the Lambda roles and Lambda service, restrict resources to stack naming patterns where possible, separate Amazon Connect phone-number permissions from app deployment, and avoid broad KMS key-policy administration outside a controlled bootstrap path.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadCallerIdentity",
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity"],
      "Resource": "*"
    },
    {
      "Sid": "ManageCloudFormationStacks",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:GetTemplateSummary",
        "cloudformation:ValidateTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ListStackResources"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageSamArtifacts",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:TagResource",
        "s3:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageLambdaFunctions",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:PutFunctionConcurrency",
        "lambda:DeleteFunctionConcurrency",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:ListFunctions",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:InvokeFunction",
        "lambda:TagResource",
        "lambda:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageIamRolesForStack",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageDynamoDbTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:UpdateContinuousBackups",
        "dynamodb:DescribeTimeToLive",
        "dynamodb:UpdateTimeToLive",
        "dynamodb:Scan",
        "dynamodb:TagResource",
        "dynamodb:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageKmsKey",
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:CreateAlias",
        "kms:CreateGrant",
        "kms:DeleteAlias",
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey",
        "kms:ScheduleKeyDeletion",
        "kms:DescribeKey",
        "kms:EnableKeyRotation",
        "kms:GetKeyPolicy",
        "kms:ListGrants",
        "kms:PutKeyPolicy",
        "kms:RevokeGrant",
        "kms:TagResource",
        "kms:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageCloudWatchLogGroups",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:FilterLogEvents",
        "logs:PutRetentionPolicy",
        "logs:TagResource",
        "logs:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageRuntimeConfiguration",
      "Effect": "Allow",
      "Action": [
        "ssm:AddTagsToResource",
        "ssm:DeleteParameter",
        "ssm:DescribeParameters",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "ssm:PutParameter",
        "ssm:RemoveTagsFromResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageDashboardAuthentication",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:CreateUserPool",
        "cognito-idp:DeleteUserPool",
        "cognito-idp:DescribeUserPool",
        "cognito-idp:UpdateUserPool",
        "cognito-idp:CreateUserPoolClient",
        "cognito-idp:DeleteUserPoolClient",
        "cognito-idp:DescribeUserPoolClient",
        "cognito-idp:UpdateUserPoolClient",
        "cognito-idp:CreateUserPoolDomain",
        "cognito-idp:DeleteUserPoolDomain",
        "cognito-idp:DescribeUserPoolDomain",
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:TagResource",
        "cognito-idp:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ManageHttpApi",
      "Effect": "Allow",
      "Action": "apigateway:*",
      "Resource": [
        "arn:aws:apigateway:us-east-1::/apis",
        "arn:aws:apigateway:us-east-1::/apis/*",
        "arn:aws:apigateway:us-east-1::/tags/*"
      ]
    },
    {
      "Sid": "ManageAmazonConnectDemo",
      "Effect": "Allow",
      "Action": [
        "connect:ListInstances",
        "connect:DescribeInstance",
        "connect:AssociateLambdaFunction",
        "connect:DisassociateLambdaFunction",
        "connect:CreateIntegrationAssociation",
        "connect:DeleteIntegrationAssociation",
        "connect:ListIntegrationAssociations",
        "connect:CreateContactFlow",
        "connect:DeleteContactFlow",
        "connect:DescribeContactFlow",
        "connect:UpdateContactFlowContent",
        "connect:UpdateContactFlowName",
        "connect:ListPhoneNumbers",
        "connect:ClaimPhoneNumber",
        "connect:AssociatePhoneNumberContactFlow",
        "connect:ReleasePhoneNumber",
        "connect:TagResource",
        "connect:UntagResource"
      ],
      "Resource": "*"
    }
  ]
}
```

## Deploy Commands

Validate and build:

```bash
npm run sam:validate
npm run sam:build
```

Deploy:

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Stage=dev \
    AllowedOrigin=http://localhost:5173 \
    DashboardCallbackUrl=http://localhost:5173/ \
    DashboardLogoutUrl=http://localhost:5173/ \
    ConnectInstanceArn= \
    TtlDays=30 \
    MaxVanityCandidates=1000 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

The deployment outputs include:

```txt
ApiEndpoint
GenerateVanityNumbersFunctionArn
GetLastCallersFunctionArn
VanityNumbersTableName
LatestCallersIndexName
DashboardUserPoolId
DashboardUserPoolClientId
DashboardCognitoAuthority
DashboardCognitoHostedUiUrl
```

If you already know the Amazon Connect instance, pass its ARN through `ConnectInstanceArn` to scope Lambda invocation permission to that instance. Leave it empty for early sandbox deployments before Connect is configured.

## GitHub Actions

The repository includes two workflows:

- `.github/workflows/ci.yml` runs tests, type checks, backend/frontend builds, formatting checks, SAM validation, and SAM build.
- `.github/workflows/deploy.yml` is a manual `workflow_dispatch` deployment that assumes an AWS role through GitHub OIDC.

The deploy workflow expects this repository secret:

```txt
AWS_DEPLOY_ROLE_ARN
```

Manual deploy inputs:

| Workflow input           | SAM parameter          | Local default            | Notes                                                              |
| ------------------------ | ---------------------- | ------------------------ | ------------------------------------------------------------------ |
| `stage`                  | `Stage`                | `dev`                    | Used in stack and resource names.                                  |
| `region`                 | AWS region             | `us-east-1`              | Must match the Connect/Lambda region.                              |
| `allowed_origin`         | `AllowedOrigin`        | `http://localhost:5173`  | Origin only; no trailing slash.                                    |
| `dashboard_callback_url` | `DashboardCallbackUrl` | `http://localhost:5173/` | Must exactly match the Cognito redirect URL.                       |
| `dashboard_logout_url`   | `DashboardLogoutUrl`   | `http://localhost:5173/` | Must exactly match the Cognito logout URL.                         |
| `connect_instance_arn`   | `ConnectInstanceArn`   | empty                    | Optional; scopes Lambda invoke permission to one Connect instance. |

The role trust policy should allow the repository to assume the role through `token.actions.githubusercontent.com`. A typical trust policy shape is:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:environment:dev"
        }
      }
    }
  ]
}
```

Attach the deployment policy above, or a narrower production equivalent, to the OIDC role.

## Validated Deployment

The stack was successfully deployed in `us-east-1` with stack name:

```txt
vanity-number-app-dev
```

API Gateway endpoint IDs can change if the API resource is replaced. Use the `ApiEndpoint` CloudFormation output as the source of truth after every redeploy.

## Cleanup

Delete the SAM stack:

```bash
sam delete --stack-name vanity-number-app-dev --region us-east-1
```

If Amazon Connect was configured, also release any claimed phone numbers and remove test contact flows that are no longer needed.

## References

- AWS SAM CLI install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
- `sam deploy`: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html
- CloudFormation IAM actions: https://docs.aws.amazon.com/service-authorization/latest/reference/list_awscloudformation.html
- Amazon Connect Lambda integration: https://docs.aws.amazon.com/connect/latest/adminguide/connect-lambda-functions.html
