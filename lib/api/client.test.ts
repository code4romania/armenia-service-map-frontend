import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from './client';

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
