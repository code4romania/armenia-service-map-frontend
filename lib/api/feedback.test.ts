import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { submitFeedback, downloadFeedbackCsv } from './feedback';

const fetchMock = vi.fn();

describe('feedback api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('submitFeedback POSTs the payload to /public/feedback', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'f1' }), { status: 201 }));
    const payload = {
      usefulness: 'VERY',
      found: 'YES',
      fromKarabakh: 'NO',
      locale: 'en',
      pagePath: '/en',
    } as const;
    await expect(submitFeedback(payload)).resolves.toEqual({ id: 'f1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/public\/feedback$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('downloadFeedbackCsv fetches the export with filters and clicks a download anchor', async () => {
    localStorage.setItem('accessToken', 'tok');
    fetchMock.mockResolvedValue(
      new Response('csv', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="feedback-2026-11-25.csv"' },
      }),
    );
    const createUrl = vi.fn(() => 'blob:x');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('feedback-2026-11-25.csv');
      expect(this.href).toBe('blob:x');
    });

    await downloadFeedbackCsv({ from: '2026-11-01' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/admin\/feedback\/export\?from=2026-11-01$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledWith('blob:x');
  });

  it('falls back to feedback.csv without a Content-Disposition header', async () => {
    fetchMock.mockResolvedValue(new Response('csv', { status: 200 }));
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:y', revokeObjectURL: vi.fn() }));
    let name = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      name = this.download;
    });
    await downloadFeedbackCsv({});
    expect(name).toBe('feedback.csv');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/admin\/feedback\/export$/);
  });
});
