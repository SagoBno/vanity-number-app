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
  "vanity2": "+1-800-DJOWEPP",
  "vanity3": "+1-800-DJOWEPR"
}
```

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

## 7. Optional Dashboard Check

Run the React dashboard locally:

```bash
npm run frontend:dev
```

Open the Vite URL, sign in through Cognito, and confirm that the API endpoint field points to the deployed `ApiEndpoint` output. The dashboard should show the record generated in step 3 after refresh.
