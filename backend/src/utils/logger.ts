type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  awsRequestId?: string | undefined;
  contactId?: string | undefined;
  correlationId?: string | undefined;
  callerNumberMasked?: string | undefined;
  errorName?: string | undefined;
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }),
  );
}
