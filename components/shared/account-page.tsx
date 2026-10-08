'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { changePassword, updateProfile } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/validation';

// Mirrors ChangePasswordDto on the backend (@MinLength(8)).
const MIN_PASSWORD_LENGTH = 8;

type ProfileForm = { firstName: string; lastName: string; phone: string };
type PasswordForm = { current: string; next: string; confirm: string };

const EMPTY_PASSWORD_FORM: PasswordForm = { current: '', next: '', confirm: '' };

/** Signed-in user's own account: name/phone, password change and sign-out. Rendered inside the admin and org shells. */
export function AccountPage() {
  const t = useTranslations('account');
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [profileDraft, setProfileDraft] = useState<ProfileForm | null>(null);
  const profile: ProfileForm = profileDraft ?? {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  };
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [profileStatus, setProfileStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordStatus, setPasswordStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  function setProfileField(field: keyof ProfileForm, value: string) {
    setProfileDraft({ ...profile, [field]: value });
    setProfileErrors((previous) => ({ ...previous, [field]: undefined }));
    setProfileStatus(null);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!profile.firstName.trim()) nextErrors.firstName = t('profile.firstNameRequired');
    if (!profile.lastName.trim()) nextErrors.lastName = t('profile.lastNameRequired');
    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors);
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus(null);
    try {
      await updateProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      setProfileDraft(null);
      setProfileStatus({ kind: 'success', message: t('profile.saved') });
    } catch (error) {
      setProfileStatus({ kind: 'error', message: getErrorMessage(error, t('profile.error')) });
    } finally {
      setIsSavingProfile(false);
    }
  }

  function setPasswordField(field: keyof PasswordForm, value: string) {
    setPassword((previous) => ({ ...previous, [field]: value }));
    setPasswordStatus(null);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.next.length < MIN_PASSWORD_LENGTH) {
      setPasswordStatus({ kind: 'error', message: t('password.tooShort') });
      return;
    }
    if (password.next !== password.confirm) {
      setPasswordStatus({ kind: 'error', message: t('password.mismatch') });
      return;
    }

    setIsSavingPassword(true);
    setPasswordStatus(null);
    try {
      await changePassword({ currentPassword: password.current, newPassword: password.next });
      setPassword(EMPTY_PASSWORD_FORM);
      setPasswordStatus({ kind: 'success', message: t('password.saved') });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? t('password.wrongCurrent')
          : getErrorMessage(error, t('password.error'));
      setPasswordStatus({ kind: 'error', message });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('description')}</p>
        </div>
        <Button type="button" variant="danger" onClick={() => void logout()}>
          {t('signOut')}
        </Button>
      </div>

      <section className="admin-panel mt-6 p-6" aria-labelledby="account-profile-heading">
        <h2 id="account-profile-heading" className="text-lg font-semibold text-[#111827]">
          {t('profile.title')}
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">{t('profile.description')}</p>
        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          <StatusMessage status={profileStatus} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('profile.firstName')}
              value={profile.firstName}
              onChange={(event) => setProfileField('firstName', event.target.value)}
              error={profileErrors.firstName}
              autoComplete="given-name"
              required
            />
            <Input
              label={t('profile.lastName')}
              value={profile.lastName}
              onChange={(event) => setProfileField('lastName', event.target.value)}
              error={profileErrors.lastName}
              autoComplete="family-name"
              required
            />
            <Input label={t('profile.email')} value={user?.email ?? ''} disabled readOnly autoComplete="email" />
            <Input
              label={t('profile.phone')}
              type="tel"
              value={profile.phone}
              onChange={(event) => setProfileField('phone', event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? '...' : t('profile.save')}
            </Button>
          </div>
        </form>
      </section>

      <section className="admin-panel mt-6 p-6" aria-labelledby="account-password-heading">
        <h2 id="account-password-heading" className="text-lg font-semibold text-[#111827]">
          {t('password.title')}
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">{t('password.description', { min: MIN_PASSWORD_LENGTH })}</p>
        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          <StatusMessage status={passwordStatus} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                type="password"
                label={t('password.current')}
                value={password.current}
                onChange={(event) => setPasswordField('current', event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Input
              type="password"
              label={t('password.new')}
              value={password.next}
              onChange={(event) => setPasswordField('next', event.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            <Input
              type="password"
              label={t('password.confirm')}
              value={password.confirm}
              onChange={(event) => setPasswordField('confirm', event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? '...' : t('password.save')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StatusMessage({ status }: { status: { kind: 'success' | 'error'; message: string } | null }) {
  if (!status) return null;
  const tone =
    status.kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700';
  return (
    <p role={status.kind === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${tone}`}>
      {status.message}
    </p>
  );
}
