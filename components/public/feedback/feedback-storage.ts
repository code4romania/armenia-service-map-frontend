export type FeedbackState = 'dismissed' | 'submitted';

const STATE_KEY = 'qezhet-feedback-state';
const AUTO_OPENED_KEY = 'qezhet-feedback-auto-opened';
const OWN_SEARCH_KEY = 'qezhet-feedback-own-search';

// In-memory fallback used when browser storage is unavailable.
const memory = {
  state: null as FeedbackState | null,
  autoOpened: false,
  ownSearch: false,
};

function read(kind: 'local' | 'session', key: string): string | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    return store.getItem(key);
  } catch {
    return null;
  }
}

function write(kind: 'local' | 'session', key: string, value: string): void {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    store.setItem(key, value);
  } catch {
    // fall back to memory (already updated by caller)
  }
}

function remove(kind: 'local' | 'session', key: string): void {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    store.removeItem(key);
  } catch {
    // ignore
  }
}

export const feedbackStorage = {
  getState(): FeedbackState | null {
    const stored = read('local', STATE_KEY);
    if (stored === 'dismissed' || stored === 'submitted') return stored;
    return memory.state;
  },
  setState(state: FeedbackState): void {
    memory.state = state;
    write('local', STATE_KEY, state);
  },
  wasAutoOpened(): boolean {
    return read('session', AUTO_OPENED_KEY) === '1' || memory.autoOpened;
  },
  markAutoOpened(): void {
    memory.autoOpened = true;
    write('session', AUTO_OPENED_KEY, '1');
  },
  /** Returns true once if the homepage flagged an own search, then clears it. */
  consumeOwnSearchFlag(): boolean {
    const flagged = read('session', OWN_SEARCH_KEY) === '1' || memory.ownSearch;
    memory.ownSearch = false;
    remove('session', OWN_SEARCH_KEY);
    return flagged;
  },
  markOwnSearch(): void {
    memory.ownSearch = true;
    write('session', OWN_SEARCH_KEY, '1');
  },
};
