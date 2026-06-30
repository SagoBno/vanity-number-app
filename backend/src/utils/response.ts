import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export function jsonResponse(
  statusCode: number,
  body: unknown,
  allowedOrigin: string,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'access-control-allow-origin': allowedOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
