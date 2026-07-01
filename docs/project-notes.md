# Project Notes

This document answers the writing prompts from the assignment: implementation choices, struggles, production shortcuts, and what I would improve with more time.

## Implementation Choices

The backend is serverless because the workload is request-driven and small in scope: Amazon Connect invokes one Lambda to generate vanity numbers, and the reviewer dashboard calls a second Lambda through API Gateway. Lambda, API Gateway, DynamoDB, Cognito, S3, and CloudFront keep the operational surface small while still matching a production-style AWS deployment.

AWS SAM was chosen for the deployment package because it is lightweight for Lambda-first applications and easy for a reviewer to run in another AWS account. The repository also includes helper scripts and `samconfig.toml` so the happy path is short, while the full manual SAM commands remain documented for transparency and debugging.

The vanity number algorithm is deterministic and local. It focuses on the last seven digits of the caller number, checks a curated word list first, then generates a capped candidate set. Candidates score higher when they match known words, use balanced vowels, avoid long repeated runs, and convert more of the seven-digit segment. I avoided external word APIs so the Lambda remains fast, predictable, and inexpensive.

DynamoDB stores the best five generated candidates and a masked caller number for each caller event because the assignment asks for persistence and because the dashboard needs a low-latency latest-caller read path. The table uses a `ContactId`-based idempotency key when Amazon Connect provides it, which prevents duplicate writes for retries. A GSI supports efficient reads of the latest caller records.

The dashboard API is protected with Cognito and API Gateway JWT authorization. The frontend is hosted from a private S3 bucket through CloudFront with Origin Access Control. The built frontend reads runtime settings from `config.js`, which is generated from CloudFormation outputs, so the same build can point to the correct API Gateway and Cognito resources after deployment.

## Struggles And Problems Solved

Amazon Connect could not be fully tested immediately because newly created AWS accounts can require time before Connect is available. To keep the project reviewable, the repository includes contact flow content, an optional Connect CloudFormation template, and manual setup instructions. Live phone-number validation remains pending until the account can use Connect.

Cognito callback/logout URLs and API CORS needed to work both locally and from the hosted CloudFront dashboard. The SAM template now always allows the generated CloudFront URL and accepts localhost values only when explicitly passed for local testing.

SAM parameter overrides are picky about empty values. Passing `ConnectInstanceArn=` fails validation, so the deployment workflow and local deploy script omit optional parameters when they are empty.

CloudFront cache policy configuration had a subtle constraint: compression flags are invalid for a disabled-cache policy. The dashboard now uses a long-cache policy for static assets and a no-cache policy for `config.js`, so runtime configuration can change without rebuilding every asset.

Changing the DynamoDB key design to support idempotency means an existing dev table may need replacement. For a sandbox stack, deleting and recreating the stack is acceptable and documented.

## Production Shortcuts

The application no longer stores full caller numbers in DynamoDB. In a stricter production environment that needed repeat-caller correlation beyond `ContactId`, I would add keyed hashing or tokenization instead of storing raw phone numbers.

The sandbox deployment policy is intentionally broad enough to let a reviewer deploy the whole stack. In production I would split bootstrap, deploy, and operations permissions; scope `iam:PassRole`; and restrict resources to known stack and naming patterns.

Cognito authentication is implemented, but MFA is not enforced by default. For production dashboard access, MFA should be required for reviewer/admin users.

CloudWatch log groups have retention configured, but alarms and custom business metrics are not yet included. A production version should alarm on Lambda errors/throttles, API 5xx responses, DynamoDB throttles/system errors, and unexpectedly high validation failures.

The hosted frontend uses the generated CloudFront domain. A production client deployment would usually add a custom domain, ACM certificate, Route 53 records, WAF, and a stricter security headers policy.

Automated end-to-end browser tests are not included because Cognito Hosted UI and Amazon Connect add account-specific setup. The repository instead includes unit tests, handler tests, manual AWS validation steps, and CI quality gates.

## With More Time

I would complete a live Amazon Connect phone-number test and add the real test phone number and exact test flow notes to the README.

I would add CloudWatch alarms, custom Embedded Metric Format events, and a small CloudWatch dashboard for the main operational signals.

I would add optional keyed hashing or tokenization if future requirements need privacy-preserving caller correlation across contacts.

I would enforce Cognito MFA and add OAuth scopes or groups if multiple reviewer/admin roles were required.

I would add a post-deploy smoke test that verifies the CloudFront dashboard, `config.js`, Cognito metadata, unauthenticated API rejection, and a signed-in dashboard read.

I would further reduce deployment permissions for a long-lived production account and add environment protection rules for `staging` and `prod` GitHub Actions deployments.
