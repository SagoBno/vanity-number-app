import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import type { CallerRecord } from '../types/callerRecord';

export interface CallerRepository {
  getLatestCallerRecords(limit: number): Promise<CallerRecord[]>;
  saveCallerRecord(record: CallerRecord): Promise<void>;
}

const callerRecordSchema = z.object({
  recordId: z.string().min(1),
  callerNumber: z.string().min(1),
  createdAt: z.string().min(1),
  contactId: z.string().min(1).optional(),
  vanityNumbers: z.array(z.string()),
  topThree: z.array(z.string()),
  recordType: z.literal('CALLER_RECORD'),
  ttl: z.number().int().positive().optional(),
});

export class DynamoDbCallerRepository implements CallerRepository {
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(private readonly tableName: string) {
    this.documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async saveCallerRecord(record: CallerRecord): Promise<void> {
    await this.documentClient
      .send(
        new PutCommand({
          TableName: this.tableName,
          Item: record,
          ConditionExpression: 'attribute_not_exists(recordId)',
        }),
      )
      .catch((error: unknown) => {
        if (isConditionalCheckFailed(error)) {
          return;
        }

        throw error;
      });
  }

  async getLatestCallerRecords(limit: number): Promise<CallerRecord[]> {
    const result = await this.documentClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'LatestCallersIndex',
        KeyConditionExpression: '#recordType = :recordType',
        ExpressionAttributeNames: {
          '#recordType': 'recordType',
        },
        ExpressionAttributeValues: {
          ':recordType': 'CALLER_RECORD',
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );

    return (result.Items ?? [])
      .map((item) => callerRecordSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => toCallerRecord(result.data));
  }
}

function isConditionalCheckFailed(error: unknown): boolean {
  return error instanceof Error && error.name === 'ConditionalCheckFailedException';
}

function toCallerRecord(parsedRecord: z.infer<typeof callerRecordSchema>): CallerRecord {
  const record: CallerRecord = {
    recordId: parsedRecord.recordId,
    callerNumber: parsedRecord.callerNumber,
    createdAt: parsedRecord.createdAt,
    vanityNumbers: parsedRecord.vanityNumbers,
    topThree: parsedRecord.topThree,
    recordType: parsedRecord.recordType,
  };

  return {
    ...record,
    ...(parsedRecord.contactId === undefined ? {} : { contactId: parsedRecord.contactId }),
    ...(parsedRecord.ttl === undefined ? {} : { ttl: parsedRecord.ttl }),
  };
}
