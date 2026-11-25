const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function getRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request(
  endpoint: string,
  options: RequestOptions,
  defaultHeaders: Record<string, string>,
): Promise<Response> {
  const { method = 'GET', body, headers = {} } = options;

  let accessToken = await getAccessToken();

  const makeRequest = async (token: string | null) => {
    const requestHeaders: Record<string, string> = {
      ...defaultHeaders,
      ...headers,
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeRequest(accessToken);

  if (response.status === 401 && accessToken) {
    accessToken = await refreshAccessToken();
    if (accessToken) {
      response = await makeRequest(accessToken);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message);
  }

  return response;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(endpoint, options, { 'Content-Type': 'application/json' });

  // Some endpoints (DELETE, actions) reply 200/204 with no body.
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiDownload(endpoint: string): Promise<{ blob: Blob; filename: string | null }> {
  const response = await request(endpoint, {}, {});
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return { blob: await response.blob(), filename: match ? decodeURIComponent(match[1]) : null };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string | string[],
  ) {
    super(Array.isArray(message) ? message[0] : message);
  }
}
