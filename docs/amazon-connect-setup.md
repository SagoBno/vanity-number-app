# Amazon Connect Setup

This guide connects the deployed `generateVanityNumbers` Lambda to an Amazon Connect contact flow.

## Prerequisites

- SAM stack deployed successfully.
- `GenerateVanityNumbersFunctionArn` copied from the SAM outputs.
- Amazon Connect instance created in the same AWS account and region as the Lambda.
- A claimed Amazon Connect phone number for live testing.
- If using GitHub Actions, the `Deploy` workflow has access to the `AWS_DEPLOY_ROLE_ARN` secret and the deployment role has the Amazon Connect permissions from `docs/aws-deployment-permissions-and-setup.md`.

The Connect deployment policy must include the Lambda integration and tagging actions used by CloudFormation, including `connect:ListLambdaFunctions`, `connect:TagResource`, and `connect:UntagResource`.

The repository includes optional Connect deployment artifacts:

```txt
docs/amazon-connect/contact-flow-content.json
docs/amazon-connect/connect-resources.template.yaml
```

## 1. Associate The Lambda

Recommended first step: redeploy the main SAM stack with the Connect instance ARN so Lambda invoke permission is scoped to that instance.

Find the Connect instance ARN:

1. Open the Amazon Connect console.
2. Select the target instance.
3. Copy the instance ARN from the instance overview/details page.

Redeploy with GitHub Actions:

1. Go to `Actions` -> `Deploy` -> `Run workflow`.
2. Keep `stage=dev` and `region=us-east-1`.
3. Leave the dashboard URL fields empty for CloudFront hosting.
4. Paste the instance ARN into `connect_instance_arn`.
5. Run the workflow.

Redeploy locally:

```bash
CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:123456789012:instance/00000000-0000-0000-0000-000000000000 \
npm run deploy:dev
```

After redeploy, add the Lambda to the Connect instance:

1. Open the Amazon Connect console.
2. Select the target Amazon Connect instance.
3. Go to `Flows`.
4. In the AWS Lambda section, choose `Add Lambda function`.
5. Select or paste the deployed `GenerateVanityNumbersFunctionArn`.
6. Save.

The SAM template grants Amazon Connect permission to invoke the Lambda from the same account and region. For production, redeploy the SAM stack with `ConnectInstanceArn` set to the specific Connect instance ARN so only that instance can invoke the function.

The association can also be created with CloudFormation through `docs/amazon-connect/connect-resources.template.yaml`.

## 2. Create Or Deploy The Contact Flow

### Option A: Deploy With CloudFormation

Use the optional template to create the Lambda association and contact flow:

```bash
CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:123456789012:instance/00000000-0000-0000-0000-000000000000
GENERATE_FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='GenerateVanityNumbersFunctionArn'].OutputValue" \
  --output text)

aws cloudformation deploy \
  --stack-name vanity-number-connect-dev \
  --region us-east-1 \
  --template-file docs/amazon-connect/connect-resources.template.yaml \
  --parameter-overrides \
    ConnectInstanceArn="$CONNECT_INSTANCE_ARN" \
    GenerateVanityNumbersFunctionArn="$GENERATE_FUNCTION_ARN"
```

After deployment, open Amazon Connect and attach a claimed phone number to the generated contact flow.

If a failed earlier deployment left the stack in `ROLLBACK_COMPLETE`, delete it before retrying:

```bash
aws cloudformation delete-stack \
  --stack-name vanity-number-connect-dev \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name vanity-number-connect-dev \
  --region us-east-1
```

### Option B: Create Or Import Manually

Create a contact flow with these blocks:

1. `Entry point`
2. `Set logging behavior`
3. `Invoke AWS Lambda function`
4. `Check contact attributes`
5. `Play prompt`
6. `Disconnect`

`docs/amazon-connect/contact-flow-content.json` provides the equivalent flow content. Replace `GENERATE_VANITY_NUMBERS_FUNCTION_ARN` with the deployed Lambda ARN before importing the flow content manually.

The optional CloudFormation template performs that substitution automatically through the `GenerateVanityNumbersFunctionArn` parameter.

## 3. Invoke The Lambda

In the `Invoke AWS Lambda function` block:

- Choose the deployed `generateVanityNumbers` Lambda.
- Use the default Amazon Connect event payload.
- Set a short voice-path timeout, for example 3 seconds. Keep it slightly above the Lambda p95 duration, and route timeout errors to the failure prompt.

The Lambda reads the caller number from:

```txt
Details.ContactData.CustomerEndpoint.Address
```

The Lambda returns string attributes:

```json
{
  "success": "true",
  "vanity1": "+1-800-FLOWERS",
  "vanity2": "+1-800-...",
  "vanity3": "+1-800-..."
}
```

Amazon Connect can read those values as external attributes:

```txt
$.External.success
$.External.vanity1
$.External.vanity2
$.External.vanity3
```

## 4. Handle Success And Failure

Use a `Check contact attributes` block:

- Namespace: `External`
- Key: `success`
- Condition: equals `true`

Success prompt:

```txt
Your top vanity numbers are $.External.vanity1, $.External.vanity2, and $.External.vanity3.
```

Failure prompt:

```txt
We were unable to generate vanity numbers for your phone number.
```

The Lambda intentionally returns safe fallback values for handled errors so the contact flow does not expose internal details to the caller. Contact-flow timeout and invocation errors should still route to the failure prompt.

## 5. Attach A Phone Number

1. Go to phone numbers in Amazon Connect.
2. Claim a number if one is not already available.
3. Assign the number to this contact flow.
4. Place a test call.

For a Colombia toll-free number, dial the local toll-free format from Colombia, for example `018000XXXXXX`, instead of adding `+57`. If dialing fails from one mobile carrier, test from another carrier or a fixed line because toll-free reachability can vary by carrier.

## 6. Verify The Dashboard

Read the hosted dashboard URL from CloudFormation:

```bash
aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='DashboardUrl'].OutputValue" \
  --output text
```

After the call, sign in to the dashboard with the Cognito reviewer user and refresh the records. The latest item should show the masked caller number, the top three vanity values, and `5 stored candidates`.

## Operational Notes

- Limit live call testing because Amazon Connect phone numbers and minutes may generate cost.
- Do not log full caller numbers in CloudWatch.
- The Lambda uses the raw caller number only in memory. DynamoDB stores `callerNumberMasked`, not the full caller phone number.
- Review Lambda logs for request IDs, contact IDs, and masked caller numbers.
- If the Lambda does not appear in Amazon Connect, confirm it was associated with the same Connect instance and region.
- If invocation fails, confirm the Lambda permission includes `connect.amazonaws.com` and the correct account/region.
- If the flow CloudFormation stack fails with `InvalidContactFlowException`, validate the flow-language parameters in `docs/amazon-connect/connect-resources.template.yaml`.
