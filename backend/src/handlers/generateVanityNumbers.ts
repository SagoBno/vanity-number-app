import type { Context } from 'aws-lambda';
import { getConfig } from '../config/env';
import type { CallerRepository } from '../repositories/callerRepository';
import { DynamoDbCallerRepository } from '../repositories/callerRepository';
import { generateVanityNumbers } from '../services/vanityNumberService';
import type { AmazonConnectEvent, AmazonConnectResponse } from '../types/amazonConnect';
import type { CallerRecord } from '../types/callerRecord';
import { log } from '../utils/logger';
import { maskPhoneNumber } from '../utils/maskPhoneNumber';
import { normalizePhoneNumber } from '../utils/phoneNumber';

const FALLBACK_RESPONSE: AmazonConnectResponse = {
  success: 'false',
  message: 'We were unable to generate vanity numbers for your phone number.',
  vanity1: 'not available',
  vanity2: 'not available',
  vanity3: 'not available',
};

export function createGenerateVanityNumbersHandler(repository?: CallerRepository) {
  return async (event: AmazonConnectEvent, context?: Context): Promise<AmazonConnectResponse> => {
    const contactId = event.Details?.ContactData?.ContactId;
    const rawCallerNumber = event.Details?.ContactData?.CustomerEndpoint?.Address;

    log('info', 'Received Amazon Connect vanity number request.', {
      awsRequestId: context?.awsRequestId,
      contactId,
    });

    try {
      const config = await getConfig();
      const callerRepository = repository ?? new DynamoDbCallerRepository(config.tableName);

      if (rawCallerNumber === undefined) {
        throw new Error('Missing caller number.');
      }

      const normalized = normalizePhoneNumber(rawCallerNumber);
      const callerNumberMasked = maskPhoneNumber(normalized.e164);
      const candidates = generateVanityNumbers(normalized.prefixDigits, normalized.vanityDigits, {
        maxCandidates: config.maxVanityCandidates,
      });
      const topFive = candidates.slice(0, 5).map((candidate) => candidate.value);
      const topThree = topFive.slice(0, 3);
      const record = buildCallerRecord(
        callerNumberMasked,
        topFive,
        topThree,
        config.ttlDays,
        contactId,
      );

      await callerRepository.saveCallerRecord(record);

      log('info', 'Generated and saved vanity numbers.', {
        awsRequestId: context?.awsRequestId,
        callerNumberMasked,
        contactId,
      });

      return {
        success: 'true',
        vanity1: topThree[0] ?? 'not available',
        vanity2: topThree[1] ?? 'not available',
        vanity3: topThree[2] ?? 'not available',
      };
    } catch (error) {
      log('error', 'Failed to generate vanity numbers.', {
        awsRequestId: context?.awsRequestId,
        contactId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });

      return FALLBACK_RESPONSE;
    }
  };
}

function buildCallerRecord(
  callerNumberMasked: string,
  vanityNumbers: string[],
  topThree: string[],
  ttlDays: number,
  contactId: string | undefined,
): CallerRecord {
  const now = new Date();
  const createdAt = now.toISOString();
  const ttl = Math.floor(now.getTime() / 1000) + ttlDays * 24 * 60 * 60;
  const recordId = contactId ?? `${callerNumberMasked}#${createdAt}`;
  const baseRecord: CallerRecord = {
    recordId,
    callerNumberMasked,
    createdAt,
    vanityNumbers,
    topThree,
    recordType: 'CALLER_RECORD',
    ttl,
  };

  if (contactId !== undefined) {
    return { ...baseRecord, contactId };
  }

  return baseRecord;
}

export const handler = createGenerateVanityNumbersHandler();
