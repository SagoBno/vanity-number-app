# Manual Testing Guide

This guide verifies the deployed AWS resources without Amazon Connect. It exercises the same Lambda contract that Amazon Connect uses and confirms that records are persisted and readable through the HTTP API.

## Prerequisites

- The SAM stack is deployed.
- AWS CLI is configured for the deployment account and region.
- The IAM principal used for manual testing can invoke Lambda and read CloudFormation outputs.

The validated stack name and region are:

```txt
Stack:  vanity-number-app-dev
Region: us-east-1
```

## 1. Confirm Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

Expected outputs:

```txt
ApiEndpoint
DashboardBucketName
DashboardDistributionId
DashboardUrl
GenerateVanityNumbersFunctionArn
GetLastCallersFunctionArn
VanityNumbersTableName
LatestCallersIndexName
DashboardUserPoolId
DashboardUserPoolClientId
DashboardCognitoAuthority
DashboardCognitoHostedUiUrl
```

## 2. Store The API Endpoint In A Shell Variable

```bash
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text)
```

Verify it:

```bash
echo "$API_ENDPOINT"
```

## 3. Invoke The Amazon Connect Lambda Manually

```bash
aws lambda invoke \
  --function-name vanity-number-generate-dev \
  --payload fileb://docs/sample-events/amazon-connect-event.json \
  /tmp/vanity-generate-response.json \
  --region us-east-1
```

Read the Lambda response:

```bash
cat /tmp/vanity-generate-response.json
```

Successful generation responses have this shape:

```json
{
  "success": "true",
  "vanity1": "+1-800-FLOWERS",
  "vanity2": "+1-800-...",
  "vanity3": "+1-800-..."
}
```

The first value should be `+1-800-FLOWERS` for the bundled sample event. Lower-ranked candidates can change as the scoring rules evolve.

## 4. Query The Dashboard API

The dashboard API is protected by Cognito. A request without a Bearer token should fail with `401` or `403`:

```bash
curl -sS "$API_ENDPOINT"
```

Use the React dashboard login flow for authenticated reads. The successful dashboard API response has this shape:

Expected shape:

```json
{
  "items": [
    {
      "contactId": "sample-contact-id",
      "callerNumberMasked": "+*******9377",
      "vanityNumbers": ["+1-800-FLOWERS"],
      "topThree": ["+1-800-FLOWERS"],
      "createdAt": "2026-06-29T20:36:08.122Z",
      "recordType": "CALLER_RECORD",
      "ttl": 1785357368
    }
  ]
}
```

The exact timestamps, TTL value, masked digits, and lower-ranked vanity candidates will vary. The dashboard API does not return full caller phone numbers.

## 5. Optional DynamoDB Check

```bash
aws dynamodb scan \
  --table-name vanity-number-records-dev \
  --limit 5 \
  --region us-east-1
```

This is a diagnostic check only. The application itself reads latest records through the `LatestCallersIndex` GSI.

The DynamoDB items should include `callerNumberMasked` and should not include the full caller number.

## 6. Optional Logs Check

```bash
aws logs tail /aws/lambda/vanity-number-generate-dev \
  --region us-east-1 \
  --since 10m
```

```bash
aws logs tail /aws/lambda/vanity-number-get-last-callers-dev \
  --region us-east-1 \
  --since 10m
```

Logs are structured JSON and should not contain full unmasked phone numbers.

## 7. Dashboard Check

Open the hosted dashboard from the stack output:

```bash
aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='DashboardUrl'].OutputValue" \
  --output text
```

Sign in through Cognito and refresh the dashboard. The dashboard should show the record generated in step 3 after refresh.

For local dashboard testing instead, redeploy with localhost callback/logout/CORS parameters, run `npm run frontend:dev`, and open `http://localhost:5173/`.
