# Amazon Connect Setup

This guide connects the deployed `generateVanityNumbers` Lambda to an Amazon Connect contact flow.

## Prerequisites

- SAM stack deployed successfully.
- `GenerateVanityNumbersFunctionArn` copied from the SAM outputs.
- Amazon Connect instance created in the same AWS account and region as the Lambda.
- A claimed Amazon Connect phone number for live testing.

The repository includes optional Connect deployment artifacts:

```txt
docs/amazon-connect/contact-flow-content.json
docs/amazon-connect/connect-resources.template.yaml
```

## 1. Associate The Lambda

1. Open the Amazon Connect console.
2. Select the target Amazon Connect instance.
3. Go to `Flows`.
4. In the AWS Lambda section, choose `Add Lambda function`.
5. Select or paste the deployed `GenerateVanityNumbersFunctionArn`.
6. Save.

The SAM template already grants Amazon Connect permission to invoke the Lambda from the same account and region.

The association can also be created with CloudFormation through `docs/amazon-connect/connect-resources.template.yaml`.

## 2. Create The Contact Flow

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
- Set a timeout that is longer than the Lambda timeout, for example 8 seconds.

The Lambda reads the caller number from:

```txt
Details.ContactData.CustomerEndpoint.Address
```

The Lambda returns string attributes:

```json
{
  "success": "true",
  "vanity1": "+1-800-FLOWERS",
  "vanity2": "+1-800-ELOWERS",
  "vanity3": "+1-800-DLOWERS"
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

The Lambda intentionally returns safe fallback values so the contact flow does not expose internal errors to the caller.

## 5. Attach A Phone Number

1. Go to phone numbers in Amazon Connect.
2. Claim a number if one is not already available.
3. Assign the number to this contact flow.
4. Place a test call.

## Optional CloudFormation Deployment

Deploy the Connect resources after the main SAM stack is deployed:

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

After deployment, attach a claimed Amazon Connect phone number to the generated contact flow.

## Operational Notes

- Limit live call testing because Amazon Connect phone numbers and minutes may generate cost.
- Do not log full caller numbers in CloudWatch.
- Review Lambda logs for request IDs, contact IDs, and masked caller numbers.
- If the Lambda does not appear in Amazon Connect, confirm it was associated with the same Connect instance and region.
- If invocation fails, confirm the Lambda permission includes `connect.amazonaws.com` and the correct account/region.
