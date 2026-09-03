import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  organisation: { id: string; name: string } | null;
  createdAt: string;
}

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const tokens = await apiClient<AuthTokens>('/auth/login', {
    method: 'POST',
    body: data,
  });

  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);

  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await apiClient('/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export async function getProfile(): Promise<UserProfile> {
  return apiClient<UserProfile>('/auth/me');
}

export interface SetupPasswordRequest {
  token: string;
  password: string;
}

/** Sets the password for an invited / reset user via the emailed setup token. */
export async function setupPassword(data: SetupPasswordRequest): Promise<void> {
  await apiClient('/auth/password-setup', { method: 'POST', body: data });
}
