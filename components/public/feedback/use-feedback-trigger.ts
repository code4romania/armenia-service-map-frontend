'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  FEEDBACK_DETAIL_DWELL_MS,
  FEEDBACK_RESULTS_DWELL_MS,
  FEEDBACK_SCROLL_PX,
} from './constants';

const TICK_MS = 250;
const MAX_DELTA_MS = 1_000;

interface Options {
  enabled: boolean;
  onTrigger: () => void;
}

// Only text-like fields mean "typing"; a focused checkbox/radio must not block.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'tel', 'url', 'number', 'password']);

function isTyping(active: Element | null): boolean {
  if (!active) return false;
  if (active instanceof HTMLTextAreaElement) return true;
  if (active instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(active.type);
  if (!(active instanceof HTMLElement)) return false;
  // Attribute fallback for environments without isContentEditable (jsdom).
  return (
    active.isContentEditable === true ||
    active.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}

function isBlocked(): boolean {
  if (isTyping(document.activeElement)) return true;
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

/**
 * Implements the feedback "Trigger rules": fires onTrigger once per mount when
 * either the detail-view dwell or the results interaction + scroll + dwell
 * condition is met (visible-tab time only), and no input/modal is blocking.
 * The results rule only counts dwell and scroll while /services is mounted
 * (reportResultsView / leaveResultsView).
 */
export function useFeedbackTrigger({ enabled, onTrigger }: Options) {
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  const firedRef = useRef(false);
  // True only while the /services results page is mounted.
  const resultsActiveRef = useRef(false);
  const resultsStartedRef = useRef(false);
  const resultsVisibleMsRef = useRef(0);
  const scrollMaxRef = useRef(0);
  const detailActiveRef = useRef(false);
  const detailVisibleMsRef = useRef(0);

  const reportResultsInteraction = useCallback(() => {
    // Interactions only come from the results page, so we are on it.
    resultsActiveRef.current = true;
    if (!resultsStartedRef.current) {
      resultsStartedRef.current = true;
      // Scroll done before the first interaction still counts.
      scrollMaxRef.current = Math.max(scrollMaxRef.current, window.scrollY);
    }
  }, []);
  const reportResultsView = useCallback(() => {
    resultsActiveRef.current = true;
  }, []);
  // Leaving /services pauses the results rule. Returning resumes it: the
  // accumulated dwell and max scroll are kept (not reset), so progress made on
  // the results page is not lost by a quick detour to a service detail page.
  const leaveResultsView = useCallback(() => {
    resultsActiveRef.current = false;
  }, []);
  const reportDetailView = useCallback(() => {
    detailActiveRef.current = true;
  }, []);
  const leaveDetailView = useCallback(() => {
    detailActiveRef.current = false;
    detailVisibleMsRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onScroll = () => {
      if (!resultsStartedRef.current || !resultsActiveRef.current) return;
      scrollMaxRef.current = Math.max(scrollMaxRef.current, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let last = Date.now();
    // Hidden tabs throttle timers; never credit the gap across a visibility change.
    const onVisibility = () => {
      last = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const tick = () => {
      const now = Date.now();
      const delta = Math.min(now - last, MAX_DELTA_MS);
      last = now;
      if (firedRef.current) return;

      if (document.visibilityState === 'visible') {
        if (resultsStartedRef.current && resultsActiveRef.current) {
          resultsVisibleMsRef.current += delta;
        }
        if (detailActiveRef.current) detailVisibleMsRef.current += delta;
      }

      const detailReady =
        detailActiveRef.current &&
        detailVisibleMsRef.current >= FEEDBACK_DETAIL_DWELL_MS;
      const resultsReady =
        resultsActiveRef.current &&
        resultsStartedRef.current &&
        scrollMaxRef.current >= FEEDBACK_SCROLL_PX &&
        resultsVisibleMsRef.current >= FEEDBACK_RESULTS_DWELL_MS;

      if ((detailReady || resultsReady) && !isBlocked()) {
        firedRef.current = true;
        onTriggerRef.current();
      }
    };
    const id = window.setInterval(tick, TICK_MS);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return {
    reportResultsInteraction,
    reportResultsView,
    leaveResultsView,
    reportDetailView,
    leaveDetailView,
  };
}
