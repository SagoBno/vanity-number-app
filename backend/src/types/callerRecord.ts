export interface CallerRecord {
  recordId: string;
  callerNumberMasked: string;
  createdAt: string;
  contactId?: string;
  vanityNumbers: string[];
  topThree: string[];
  recordType: 'CALLER_RECORD';
  ttl?: number;
}

export interface CallerSummary {
  callerNumberMasked: string;
  createdAt: string;
  contactId?: string;
  vanityNumbers: string[];
  topThree: string[];
  recordType: 'CALLER_RECORD';
  ttl?: number;
}
