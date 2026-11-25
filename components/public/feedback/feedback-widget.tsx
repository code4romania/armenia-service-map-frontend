'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/auth-context';
import { useFeedbackEngagement } from './feedback-engagement-context';
import { feedbackStorage } from './feedback-storage';
import { FeedbackForm } from './feedback-form';

const EXCLUDED_PATHS = ['/login', '/forgot-password', '/setup-password', '/unsubscribe'];
const THANKS_MS = 3_000;
const SERVICE_DETAIL_RE = /^\/services\/([^/]+)\/?$/;

type View = 'open' | 'collapsed' | 'thanks' | 'gone';

const noopSubscribe = () => () => {};

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Public feedback pop-up: auto-opens once when the engagement trigger fires,
 * collapses to a pill when closed, and disappears for good after submit.
 */
export function FeedbackWidget() {
  const t = useTranslations('feedback');
  const pathname = usePathname() ?? '/';
  const { isLoading, isAuthenticated } = useAuth();
  const { triggered } = useFeedbackEngagement();
  // Storage is browser-only: treat the server render and hydration as "hidden".
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const suppressed = isLoading || isAuthenticated || isExcluded(pathname);

  // null = nothing decided this visit yet; fall back to the stored state.
  const [view, setView] = useState<View | null>(null);
  const [formMounted, setFormMounted] = useState(false);
  const [seenTrigger, setSeenTrigger] = useState(false);
  const [autoOpenedNow, setAutoOpenedNow] = useState(false);

  // React to the trigger during render (no setState-in-effect).
  if (triggered && !seenTrigger && isClient && !suppressed) {
    setSeenTrigger(true);
    if (view === null && feedbackStorage.getState() === null && !feedbackStorage.wasAutoOpened()) {
      setView('open');
      setFormMounted(true);
      setAutoOpenedNow(true);
    }
  }

  const stored = isClient ? feedbackStorage.getState() : null;
  let mode: View | 'hidden' = view ?? (stored === 'dismissed' ? 'collapsed' : 'hidden');
  if (stored === 'submitted' && mode !== 'thanks') mode = 'gone';

  const dialogRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const focusTargetRef = useRef<'dialog' | 'pill' | null>(null);

  useEffect(() => {
    if (autoOpenedNow) {
      feedbackStorage.markAutoOpened();
      focusTargetRef.current = 'dialog';
    }
  }, [autoOpenedNow]);

  const visible = !suppressed && isClient;

  useEffect(() => {
    if (!visible) return;
    const target = focusTargetRef.current;
    if (target === 'dialog' && (mode === 'open' || mode === 'thanks')) {
      dialogRef.current?.focus();
      focusTargetRef.current = null;
    } else if (target === 'pill' && mode === 'collapsed') {
      pillRef.current?.focus();
      focusTargetRef.current = null;
    }
  });

  const dismiss = () => {
    feedbackStorage.setState('dismissed');
    focusTargetRef.current = 'pill';
    setView('collapsed');
  };
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    dismissRef.current = dismiss;
  });

  const isOpen = visible && mode === 'open';
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissRef.current();
    };
    // `click`, not pointerdown: a touch-scroll on the page must not dismiss.
    // A disconnected target is the pill that just opened the dialog.
    const onClick = (event: MouseEvent) => {
      const node = dialogRef.current;
      const target = event.target;
      if (node && target instanceof Node && target.isConnected && !node.contains(target)) dismissRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (view !== 'thanks') return;
    const id = window.setTimeout(() => setView('gone'), THANKS_MS);
    return () => window.clearTimeout(id);
  }, [view]);

  if (!visible || mode === 'hidden' || mode === 'gone') return null;

  const openFromPill = () => {
    focusTargetRef.current = 'dialog';
    setFormMounted(true);
    setView('open');
  };

  const handleSubmitted = () => {
    feedbackStorage.setState('submitted');
    focusTargetRef.current = 'dialog';
    // If the user collapsed the dialog while sending, don't pop it back up.
    setView((current) => (current === 'open' ? 'thanks' : 'gone'));
  };

  const serviceId = SERVICE_DETAIL_RE.exec(pathname)?.[1];
  const showDialog = mode === 'open' || mode === 'thanks';

  return (
    <>
      {formMounted || mode === 'thanks' ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="false"
          aria-label={t('title')}
          tabIndex={-1}
          hidden={!showDialog}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-[#e5e7eb] bg-white px-5 pb-5 shadow-2xl outline-none sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl"
        >
          {mode === 'thanks' ? (
            <p role="status" className="py-8 text-center text-base font-semibold text-[#101828]">
              {t('thanks')}
            </p>
          ) : (
            <FeedbackForm
              pagePath={pathname}
              serviceId={serviceId}
              onSubmitted={handleSubmitted}
              onClose={dismiss}
            />
          )}
        </div>
      ) : null}
      {mode === 'collapsed' ? (
        <button
          ref={pillRef}
          type="button"
          onClick={openFromPill}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#E8922D] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#d17f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8922D] sm:bottom-6 sm:right-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {t('button')}
        </button>
      ) : null}
    </>
  );
}
