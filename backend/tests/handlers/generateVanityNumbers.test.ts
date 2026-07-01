import type { CallerRepository } from '../../src/repositories/callerRepository';
import { createGenerateVanityNumbersHandler } from '../../src/handlers/generateVanityNumbers';
import type { AmazonConnectEvent } from '../../src/types/amazonConnect';
import type { CallerRecord } from '../../src/types/callerRecord';

describe('generateVanityNumbers handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MAX_VANITY_CANDIDATES: '25',
      TTL_DAYS: '30',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns top three vanity numbers and stores top five', async () => {
    const savedRecords: CallerRecord[] = [];
    const repository: CallerRepository = {
      getLatestCallerRecords: jest.fn(),
      saveCallerRecord: jest.fn(async (record) => {
        savedRecords.push(record);
      }),
    };
    const handler = createGenerateVanityNumbersHandler(repository);
    const event: AmazonConnectEvent = {
      Details: {
        ContactData: {
          ContactId: 'contact-123',
          CustomerEndpoint: {
            Address: '+1 (800) 356-9377',
          },
        },
      },
    };

    const response = await handler(event);

    expect(response).toMatchObject({
      success: 'true',
      vanity1: '+1-800-FLOWERS',
    });
    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0]).toMatchObject({
      recordId: 'contact-123',
      callerNumberMasked: '+*******9377',
      contactId: 'contact-123',
      recordType: 'CALLER_RECORD',
    });
    expect(JSON.stringify(savedRecords[0])).not.toContain('+18003569377');
    expect(savedRecords[0]?.vanityNumbers).toHaveLength(5);
    expect(savedRecords[0]?.topThree).toHaveLength(3);
    expect(savedRecords[0]?.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('returns a safe fallback when caller number is missing', async () => {
    const repository: CallerRepository = {
      getLatestCallerRecords: jest.fn(),
      saveCallerRecord: jest.fn(),
    };
    const handler = createGenerateVanityNumbersHandler(repository);

    const response = await handler({ Details: { ContactData: {} } });

    expect(response).toEqual({
      success: 'false',
      message: 'We were unable to generate vanity numbers for your phone number.',
      vanity1: 'not available',
      vanity2: 'not available',
      vanity3: 'not available',
    });
    expect(repository.saveCallerRecord).not.toHaveBeenCalled();
  });

  it('returns a safe fallback when persistence fails', async () => {
    const repository: CallerRepository = {
      getLatestCallerRecords: jest.fn(),
      saveCallerRecord: jest.fn(async () => {
        throw new Error('DynamoDB unavailable');
      }),
    };
    const handler = createGenerateVanityNumbersHandler(repository);

    const response = await handler({
      Details: {
        ContactData: {
          CustomerEndpoint: {
            Address: '+18003569377',
          },
        },
      },
    });

    expect(response.success).toBe('false');
    expect(response.vanity1).toBe('not available');
  });
});
