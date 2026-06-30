import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import { getConfig } from '../config/env';
import type { CallerRepository } from '../repositories/callerRepository';
import { DynamoDbCallerRepository } from '../repositories/callerRepository';
import { log } from '../utils/logger';
import { jsonResponse } from '../utils/response';

const LATEST_CALLERS_LIMIT = 5;

export function createGetLastCallersHandler(repository?: CallerRepository) {
  return async (
    _event: APIGatewayProxyEventV2,
    context?: Context,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    let allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';

    try {
      const config = await getConfig();
      allowedOrigin = config.allowedOrigin;
      const callerRepository = repository ?? new DynamoDbCallerRepository(config.tableName);
      const items = await callerRepository.getLatestCallerRecords(LATEST_CALLERS_LIMIT);

      log('info', 'Fetched latest caller records.', {
        awsRequestId: context?.awsRequestId,
      });

      return jsonResponse(200, { items }, config.allowedOrigin);
    } catch (error) {
      log('error', 'Failed to fetch latest caller records.', {
        awsRequestId: context?.awsRequestId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });

      return jsonResponse(500, { message: 'Unable to fetch latest callers.' }, allowedOrigin);
    }
  };
}

export const handler = createGetLastCallersHandler();
