'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  FEEDBACK_DETAIL_DWELL_MS,
  FEEDBACK_RESULTS_DWELL_MS,
  FEEDBACK_SCROLL_PX,
} from './constants';

const TICK_MS = 250;

interface Options {
  enabled: boolean;
  onTrigger: () => void;
}

function isBlocked(): boolean {
  const active = document.activeElement;
  if (active) {
    const tag = active.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
  }
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

/**
 * Implements the feedback "Trigger rules": fires onTrigger once per mount when
 * either the detail-view dwell or the results interaction + scroll + dwell
 * condition is met (visible-tab time only), and no input/modal is blocking.
 */
export function useFeedbackTrigger({ enabled, onTrigger }: Options) {
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  const firedRef = useRef(false);
  const resultsStartedRef = useRef(false);
  const resultsVisibleMsRef = useRef(0);
  const scrollMaxRef = useRef(0);
  const detailActiveRef = useRef(false);
  const detailVisibleMsRef = useRef(0);

  const reportResultsInteraction = useCallback(() => {
    resultsStartedRef.current = true;
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
      if (!resultsStartedRef.current) return;
      scrollMaxRef.current = Math.max(scrollMaxRef.current, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (firedRef.current) return;

      if (document.visibilityState === 'visible') {
        if (resultsStartedRef.current) resultsVisibleMsRef.current += delta;
        if (detailActiveRef.current) detailVisibleMsRef.current += delta;
      }

      const detailReady =
        detailActiveRef.current &&
        detailVisibleMsRef.current >= FEEDBACK_DETAIL_DWELL_MS;
      const resultsReady =
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
    };
  }, [enabled]);

  return { reportResultsInteraction, reportDetailView, leaveDetailView };
}
