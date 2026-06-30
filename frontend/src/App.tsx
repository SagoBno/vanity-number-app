import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  LogIn,
  LogOut,
  Phone,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultApiEndpoint, fetchLatestCallers } from './api';
import {
  completeSignInIfNeeded,
  isAuthConfigured,
  signIn,
  signOut,
  type AuthSession,
} from './auth';
import type { CallerRecord } from './types';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type AuthState = 'checking' | 'disabled' | 'signed-out' | 'signed-in' | 'error';

const deployedFallbackEndpoint =
  'https://70lijskhr5.execute-api.us-east-1.amazonaws.com/dev/callers/latest';

export function App() {
  const [apiEndpoint, setApiEndpoint] = useState(defaultApiEndpoint ?? deployedFallbackEndpoint);
  const [records, setRecords] = useState<CallerRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    async function initializeAuth() {
      if (!isAuthConfigured()) {
        setAuthState('disabled');
        return;
      }

      try {
        const session = await completeSignInIfNeeded();
        setAuthSession(session);
        setAuthState(session === null ? 'signed-out' : 'signed-in');
      } catch (error) {
        setAuthState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to initialize sign in.');
      }
    }

    void initializeAuth();
  }, []);

  const loadRecords = useCallback(async () => {
    const endpoint = apiEndpoint.trim();

    if (endpoint.length === 0) {
      setLoadState('error');
      setErrorMessage('API endpoint is required.');
      return;
    }

    if (authState === 'checking') {
      return;
    }

    if (authState === 'signed-out') {
      setLoadState('idle');
      setErrorMessage('Sign in to load caller records.');
      return;
    }

    setLoadState('loading');
    setErrorMessage(null);

    try {
      const payload = await fetchLatestCallers(endpoint, authSession?.accessToken);
      setRecords(payload.items);
      setLastUpdatedAt(new Date());
      setLoadState('ready');
    } catch (error) {
      setLoadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load caller records.');
    }
  }, [apiEndpoint, authSession?.accessToken, authState]);

  useEffect(() => {
    if (authState !== 'checking') {
      void loadRecords();
    }
  }, [authState, loadRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return records;
    }

    return records.filter((record) => {
      const searchable = [
        record.callerNumber,
        record.contactId ?? '',
        ...record.topThree,
        ...record.vanityNumbers,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [query, records]);

  const metrics = useMemo(() => {
    const uniqueCallers = new Set(records.map((record) => record.callerNumber)).size;
    const generatedNumbers = records.reduce(
      (total, record) => total + record.vanityNumbers.length,
      0,
    );

    return {
      uniqueCallers,
      generatedNumbers,
      latestCall:
        records.length > 0 ? formatTimestamp(records[0]?.createdAt ?? '') : 'No calls yet',
    };
  }, [records]);

  const isLoading = loadState === 'loading';

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Amazon Connect</p>
          <h1>Vanity Number Dashboard</h1>
        </div>
        <div className={`status-pill status-pill--${loadState}`}>
          {loadState === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusLabel(loadState)}</span>
        </div>
      </header>

      <section className="control-strip" aria-label="Dashboard controls">
        <label className="endpoint-control">
          <span>API endpoint</span>
          <input
            value={apiEndpoint}
            onChange={(event) => setApiEndpoint(event.target.value)}
            spellCheck={false}
          />
        </label>
        <label className="search-control">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search caller, contact, vanity number"
          />
        </label>
        <button className="icon-button" disabled={isLoading} onClick={() => void loadRecords()}>
          <RefreshCw size={18} />
          <span>{isLoading ? 'Refreshing' : 'Refresh'}</span>
        </button>
        <AuthControl
          authState={authState}
          email={authSession?.email ?? null}
          onSignIn={() => void signIn()}
          onSignOut={() => void signOut()}
        />
      </section>

      <section className="metrics-grid" aria-label="Call metrics">
        <Metric label="Recent calls" value={records.length.toString()} icon={<Phone size={20} />} />
        <Metric
          label="Unique callers"
          value={metrics.uniqueCallers.toString()}
          icon={<Copy size={20} />}
        />
        <Metric
          label="Generated numbers"
          value={metrics.generatedNumbers.toString()}
          icon={<CheckCircle2 size={20} />}
        />
        <Metric label="Latest call" value={metrics.latestCall} icon={<Clock3 size={20} />} />
      </section>

      {errorMessage !== null && (
        <section className="message-band message-band--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </section>
      )}

      <section className="records-layout" aria-label="Latest caller records">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <CallerRecordCard key={recordKey(record)} record={record} />
          ))
        ) : (
          <div className="empty-state">
            <Phone size={28} />
            <h2>{isLoading ? 'Loading caller records' : 'No caller records found'}</h2>
            <p>
              {isLoading
                ? 'Refreshing from the deployed API.'
                : 'Try another search or invoke the Lambda.'}
            </p>
          </div>
        )}
      </section>

      <footer className="footer-line">
        <span>
          {lastUpdatedAt === null ? 'Not refreshed yet' : `Updated ${formatTime(lastUpdatedAt)}`}
        </span>
      </footer>
    </main>
  );
}

function AuthControl({
  authState,
  email,
  onSignIn,
  onSignOut,
}: {
  authState: AuthState;
  email: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (authState === 'disabled') {
    return (
      <div className="auth-status" aria-label="Authentication status">
        <span>Auth not configured</span>
      </div>
    );
  }

  if (authState === 'signed-in') {
    return (
      <button className="icon-button icon-button--secondary" onClick={onSignOut}>
        <LogOut size={18} />
        <span>{email ?? 'Sign out'}</span>
      </button>
    );
  }

  return (
    <button className="icon-button icon-button--secondary" onClick={onSignIn}>
      <LogIn size={18} />
      <span>{authState === 'checking' ? 'Checking' : 'Sign in'}</span>
    </button>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CallerRecordCard({ record }: { record: CallerRecord }) {
  return (
    <article className="record-card">
      <div className="record-card__header">
        <div>
          <span className="record-card__label">Caller</span>
          <h2>{maskPhone(record.callerNumber)}</h2>
        </div>
        <time dateTime={record.createdAt}>{formatTimestamp(record.createdAt)}</time>
      </div>

      <div className="top-three" aria-label="Top vanity numbers">
        {record.topThree.map((number, index) => (
          <span
            key={number}
            className={index === 0 ? 'top-three__item top-three__item--best' : 'top-three__item'}
          >
            {number}
          </span>
        ))}
      </div>

      <div className="record-card__meta">
        <span>{record.contactId ?? 'No contact ID'}</span>
        <span>{record.vanityNumbers.length} stored candidates</span>
      </div>
    </article>
  );
}

function recordKey(record: CallerRecord): string {
  return `${record.callerNumber}-${record.createdAt}`;
}

function maskPhone(phoneNumber: string): string {
  const visibleDigits = phoneNumber.replace(/\D/g, '').slice(-4);
  return `+*-***-***-${visibleDigits || '0000'}`;
}

function formatTimestamp(value: string): string {
  if (value.length === 0) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);
}

function statusLabel(loadState: LoadState): string {
  if (loadState === 'loading') {
    return 'Syncing';
  }

  if (loadState === 'error') {
    return 'Needs attention';
  }

  if (loadState === 'ready') {
    return 'Connected';
  }

  return 'Starting';
}
