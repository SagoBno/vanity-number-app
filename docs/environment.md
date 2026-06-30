# Environment Variables

The project has three configuration contexts:

- Backend Lambda runtime configuration is stored in AWS Systems Manager Parameter Store.
- Backend Lambda infrastructure references are configured by AWS SAM in `backend/template.yaml`.
- Frontend variables are configured by Vite in `frontend/.env`.

`.env.example` files are examples only. They are not loaded automatically.

## Backend

The backend reads configuration in `backend/src/config/env.ts`.

In AWS, each Lambda receives:

| Variable                | Source                   | Purpose                              |
| ----------------------- | ------------------------ | ------------------------------------ |
| `CONFIG_PARAMETER_PATH` | SAM environment variable | SSM path used to load runtime config |
| `TABLE_NAME`            | SAM environment variable | DynamoDB table created by the stack  |

The stack creates these SSM parameters:

| SSM Parameter                                      | Used By                        | Purpose                                       |
| -------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| `/vanity-number-app/{stage}/allowed-origin`        | `getLastCallers` API responses | CORS origin returned by the Lambda response   |
| `/vanity-number-app/{stage}/ttl-days`              | `generateVanityNumbers`        | Days before DynamoDB TTL expiration           |
| `/vanity-number-app/{stage}/max-vanity-candidates` | Vanity generation service      | Maximum generated candidate count per request |

SAM creates and updates those SSM parameters from deployment parameters:

```yaml
AllowedOriginParameter:
  Type: AWS::SSM::Parameter
  Properties:
    Name: !Sub /vanity-number-app/${Stage}/allowed-origin
    Type: String
    Value: !Ref AllowedOrigin
```

Change deployed config through SAM parameters:

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
    MaxVanityCandidates=1000
```

For local shell execution, export variables manually or copy `backend/.env.example` to `backend/.env` and load it with a shell helper. The TypeScript backend does not include `dotenv`.

Local backend fallbacks still support:

| Variable                | Default                 |
| ----------------------- | ----------------------- |
| `ALLOWED_ORIGIN`        | `http://localhost:5173` |
| `TABLE_NAME`            | `VanityNumbers-local`   |
| `TTL_DAYS`              | `30`                    |
| `MAX_VANITY_CANDIDATES` | `1000`                  |

## Secrets

The current application does not need a secret. If a future integration adds API keys, OAuth credentials, or database credentials, store those in AWS Secrets Manager or encrypted SSM SecureString parameters instead of plaintext Lambda environment variables.

Use this split:

| Data Type                          | Recommended Store         |
| ---------------------------------- | ------------------------- |
| Non-secret runtime config          | SSM Parameter Store       |
| Secrets requiring rotation/audit   | AWS Secrets Manager       |
| CloudFormation resource references | SAM environment variables |

## Frontend

The frontend reads variables through Vite:

| Variable                     | Used By                | Purpose                         |
| ---------------------------- | ---------------------- | ------------------------------- |
| `VITE_API_ENDPOINT`          | `frontend/src/api.ts`  | URL for `GET /callers/latest`.  |
| `VITE_COGNITO_AUTHORITY`     | `frontend/src/auth.ts` | Cognito OIDC authority URL.     |
| `VITE_COGNITO_HOSTED_UI_URL` | `frontend/src/auth.ts` | Cognito hosted UI base URL.     |
| `VITE_COGNITO_CLIENT_ID`     | `frontend/src/auth.ts` | Cognito app client ID.          |
| `VITE_COGNITO_REDIRECT_URI`  | `frontend/src/auth.ts` | OAuth callback URL.             |
| `VITE_COGNITO_LOGOUT_URI`    | `frontend/src/auth.ts` | OAuth post-logout redirect URL. |

Create a local frontend env file:

```bash
cp frontend/.env.example frontend/.env
```

Then update the endpoint if the API Gateway URL changed:

```txt
VITE_API_ENDPOINT=<ApiEndpoint>
VITE_COGNITO_AUTHORITY=<DashboardCognitoAuthority>
VITE_COGNITO_HOSTED_UI_URL=<DashboardCognitoHostedUiUrl>
VITE_COGNITO_CLIENT_ID=<DashboardUserPoolClientId>
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Restart Vite after changing `frontend/.env`:

```bash
npm run frontend:dev
```

Only variables prefixed with `VITE_` are exposed to frontend code.
