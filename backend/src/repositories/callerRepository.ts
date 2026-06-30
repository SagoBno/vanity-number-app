import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { CallerRecord } from '../types/callerRecord';

export interface CallerRepository {
  getLatestCallerRecords(limit: number): Promise<CallerRecord[]>;
  saveCallerRecord(record: CallerRecord): Promise<void>;
}

export class DynamoDbCallerRepository implements CallerRepository {
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(private readonly tableName: string) {
    this.documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async saveCallerRecord(record: CallerRecord): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      }),
    );
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

    return (result.Items ?? []) as CallerRecord[];
  }
}
