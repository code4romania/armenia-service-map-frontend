import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('feedbackStorage', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('round-trips state through localStorage', async () => {
    const { feedbackStorage } = await import('./feedback-storage');
    expect(feedbackStorage.getState()).toBeNull();
    feedbackStorage.setState('submitted');
    expect(feedbackStorage.getState()).toBe('submitted');
    expect(window.localStorage.getItem('qezhet-feedback-state')).toBe('submitted');
  });

  it('tracks auto-open per session and consumes own-search flag once', async () => {
    const { feedbackStorage } = await import('./feedback-storage');
    expect(feedbackStorage.wasAutoOpened()).toBe(false);
    feedbackStorage.markAutoOpened();
    expect(feedbackStorage.wasAutoOpened()).toBe(true);
    expect(feedbackStorage.consumeOwnSearchFlag()).toBe(false);
    feedbackStorage.markOwnSearch();
    expect(feedbackStorage.consumeOwnSearchFlag()).toBe(true);
    expect(feedbackStorage.consumeOwnSearchFlag()).toBe(false);
  });

  it('falls back to memory when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const { feedbackStorage } = await import('./feedback-storage');
    expect(feedbackStorage.getState()).toBeNull();
    feedbackStorage.setState('dismissed');
    expect(feedbackStorage.getState()).toBe('dismissed');
    feedbackStorage.markAutoOpened();
    expect(feedbackStorage.wasAutoOpened()).toBe(true);
  });
});
