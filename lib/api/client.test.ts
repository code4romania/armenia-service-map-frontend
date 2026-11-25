import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, apiDownload, ApiError } from './client';

const fetchMock = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns undefined for a 200 with an empty body (e.g. DELETE)', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    await expect(apiClient('/admin/users/u1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('parses a JSON body', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'u1' }), { status: 200 }));
    await expect(apiClient<{ id: string }>('/admin/users/u1')).resolves.toEqual({ id: 'u1' });
  });

  it('throws ApiError with the server message on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: ['User not found'] }), { status: 404 }));
    await expect(apiClient('/admin/users/u1')).rejects.toMatchObject({ status: 404, message: 'User not found' });
    await expect(apiClient('/admin/users/u1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('apiDownload', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns the blob and the Content-Disposition filename, sending the bearer token', async () => {
    localStorage.setItem('accessToken', 'tok');
    fetchMock.mockResolvedValue(
      new Response('a,b', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="feedback-2026-11-25.csv"' },
      }),
    );
    const result = await apiDownload('/admin/feedback/export');
    expect(result.filename).toBe('feedback-2026-11-25.csv');
    expect(result.blob.size).toBe(3);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('returns a null filename without the header', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 200 }));
    expect((await apiDownload('/x')).filename).toBeNull();
  });

  it('refreshes the token once on 401 and retries', async () => {
    localStorage.setItem('accessToken', 'old');
    localStorage.setItem('refreshToken', 'r');
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'new', refreshToken: 'r2' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const result = await apiDownload('/x');
    expect(result.blob.size).toBe(2);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });

  it('throws ApiError on non-2xx', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }));
    await expect(apiDownload('/x')).rejects.toMatchObject({ status: 403, message: 'Forbidden' });
  });
});
