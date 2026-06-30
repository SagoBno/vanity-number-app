export interface CallerRecord {
  callerNumber: string;
  createdAt: string;
  contactId?: string;
  vanityNumbers: string[];
  topThree: string[];
  recordType: 'CALLER_RECORD';
  ttl?: number;
}

export interface LatestCallersResponse {
  items: CallerRecord[];
}
