import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { createGetLastCallersHandler } from '../../src/handlers/getLastCallers';
import type { CallerRepository } from '../../src/repositories/callerRepository';
import type { CallerRecord } from '../../src/types/callerRecord';

const apiEvent = {} as APIGatewayProxyEventV2;

describe('getLastCallers handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ALLOWED_ORIGIN: 'https://example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the latest caller records', async () => {
    const item: CallerRecord = {
      recordId: 'contact-123',
      callerNumber: '+18003569377',
      createdAt: '2026-06-25T18:00:00.000Z',
      contactId: 'contact-123',
      vanityNumbers: ['+1-800-FLOWERS'],
      topThree: ['+1-800-FLOWERS'],
      recordType: 'CALLER_RECORD',
    };
    const repository: CallerRepository = {
      getLatestCallerRecords: jest.fn(async () => [item]),
      saveCallerRecord: jest.fn(),
    };
    const handler = createGetLastCallersHandler(repository);

    const response = await handler(apiEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      'access-control-allow-origin': 'https://example.com',
    });
    expect(JSON.parse(response.body ?? '{}')).toEqual({
      items: [
        {
          callerNumberMasked: '+*******9377',
          createdAt: '2026-06-25T18:00:00.000Z',
          contactId: 'contact-123',
          vanityNumbers: ['+1-800-FLOWERS'],
          topThree: ['+1-800-FLOWERS'],
          recordType: 'CALLER_RECORD',
        },
      ],
    });
    expect(response.body).not.toContain('+18003569377');
    expect(repository.getLatestCallerRecords).toHaveBeenCalledWith(5);
  });

  it('returns a safe error response when DynamoDB fails', async () => {
    const repository: CallerRepository = {
      getLatestCallerRecords: jest.fn(async () => {
        throw new Error('DynamoDB unavailable');
      }),
      saveCallerRecord: jest.fn(),
    };
    const handler = createGetLastCallersHandler(repository);

    const response = await handler(apiEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body ?? '{}')).toEqual({
      message: 'Unable to fetch latest callers.',
    });
  });
});
