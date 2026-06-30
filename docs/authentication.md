# Dashboard Authentication

The dashboard API is protected with Amazon Cognito and an API Gateway HTTP API JWT authorizer.

## Architecture

```txt
React dashboard
  -> Cognito managed login
  -> receives OIDC access token
  -> calls GET /callers/latest with Authorization: Bearer <token>
  -> API Gateway validates JWT
  -> getLastCallers Lambda runs only for valid tokens
```

Amazon Connect is not affected by this authentication layer because it invokes `generateVanityNumbers` directly through Lambda permissions.

## Stack Outputs

After deployment, read the auth outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name vanity-number-app-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

Relevant outputs:

```txt
ApiEndpoint
DashboardUrl
DashboardUserPoolId
DashboardUserPoolClientId
DashboardCognitoAuthority
DashboardCognitoHostedUiUrl
```

## Hosted Dashboard Configuration

The SAM stack provisions a CloudFront dashboard URL and automatically allows it as a Cognito callback/logout URL. The deployed frontend reads `config.js`, which should be generated from stack outputs and uploaded with the frontend build.

Use `DashboardUrl` to open the hosted dashboard.

## Local Frontend Configuration

Create a local frontend env file:

```bash
cp frontend/.env.example frontend/.env
```

Populate it from the stack outputs:

```txt
VITE_API_ENDPOINT=<ApiEndpoint>
VITE_COGNITO_AUTHORITY=<DashboardCognitoAuthority>
VITE_COGNITO_HOSTED_UI_URL=<DashboardCognitoHostedUiUrl>
VITE_COGNITO_CLIENT_ID=<DashboardUserPoolClientId>
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

For local testing, redeploy with `AllowedOrigin=http://localhost:5173`, `DashboardCallbackUrl=http://localhost:5173/`, and `DashboardLogoutUrl=http://localhost:5173/`. The redirect and logout URLs must match those SAM parameters exactly.

## Create A Demo User

The Cognito user pool disables public self sign-up. Create reviewer/demo users explicitly:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id USER_POOL_ID \
  --username reviewer@example.com \
  --user-attributes Name=email,Value=reviewer@example.com Name=email_verified,Value=true \
  --region us-east-1
```

For a simple local demo, set a permanent password:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id USER_POOL_ID \
  --username reviewer@example.com \
  --password 'Replace-With-A-Strong-Password-123!' \
  --permanent \
  --region us-east-1
```

## Local Test

Run the dashboard:

```bash
npm run frontend:dev
```

Open:

```txt
http://localhost:5173/
```

Use `Sign in`, authenticate through Cognito, and refresh the dashboard records.

Unauthenticated requests to `GET /callers/latest` should return `401` or `403`; that is expected.
