import { act, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFeedbackTrigger } from './use-feedback-trigger';
import {
  FeedbackEngagementProvider,
  useFeedbackEngagement,
} from './feedback-engagement-context';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  window.dispatchEvent(new Event('scroll'));
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useFeedbackTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
    scrollTo(0);
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function setup() {
    const onTrigger = vi.fn();
    const hook = renderHook(() => useFeedbackTrigger({ enabled: true, onTrigger }));
    return { onTrigger, hook };
  }

  it('does not fire without a results interaction', () => {
    const { onTrigger } = setup();
    scrollTo(500);
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('fires once after interaction + scroll 300 + 30s', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsInteraction());
    scrollTo(300);
    advance(29_000);
    expect(onTrigger).not.toHaveBeenCalled();
    advance(1_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    advance(60_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not fire without scroll', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsInteraction());
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('counts only visible time', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsInteraction());
    scrollTo(400);
    advance(20_000);
    act(() => setVisibility('hidden'));
    advance(60_000);
    act(() => setVisibility('visible'));
    advance(9_000);
    expect(onTrigger).not.toHaveBeenCalled();
    advance(1_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not credit time elapsed while hidden when timers were throttled', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsInteraction());
    scrollTo(400);
    advance(1_000);
    act(() => setVisibility('hidden'));
    // Clock jumps with no timer ticks (throttled hidden tab).
    act(() => {
      vi.setSystemTime(Date.now() + 60_000);
      setVisibility('visible');
    });
    advance(1_000);
    expect(onTrigger).not.toHaveBeenCalled();
    advance(28_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('counts scroll done before the first results interaction', () => {
    const { onTrigger, hook } = setup();
    scrollTo(350);
    act(() => hook.result.current.reportResultsInteraction());
    advance(30_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not fire after the visitor leaves /services', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsView());
    act(() => hook.result.current.reportResultsInteraction());
    act(() => hook.result.current.leaveResultsView());
    // Scrolling and dwelling on another page (e.g. /report-a-need) must not count.
    scrollTo(500);
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('resumes accumulated dwell and scroll on returning to /services', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsView());
    act(() => hook.result.current.reportResultsInteraction());
    scrollTo(400);
    advance(20_000);
    act(() => hook.result.current.leaveResultsView());
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
    act(() => hook.result.current.reportResultsView());
    advance(9_000);
    expect(onTrigger).not.toHaveBeenCalled();
    advance(1_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not count scroll made away from /services', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportResultsView());
    act(() => hook.result.current.reportResultsInteraction());
    act(() => hook.result.current.leaveResultsView());
    scrollTo(500);
    scrollTo(0);
    act(() => hook.result.current.reportResultsView());
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('fires after 15s on a detail view', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportDetailView());
    advance(14_000);
    expect(onTrigger).not.toHaveBeenCalled();
    advance(1_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not fire if the detail view is left early', () => {
    const { onTrigger, hook } = setup();
    act(() => hook.result.current.reportDetailView());
    advance(10_000);
    act(() => hook.result.current.leaveDetailView());
    advance(60_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('waits while an input is focused, then fires within 1s of blur', () => {
    const { onTrigger, hook } = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => hook.result.current.reportDetailView());
    advance(40_000);
    expect(onTrigger).not.toHaveBeenCalled();
    act(() => input.blur());
    advance(1_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not treat a focused checkbox as typing', () => {
    const { onTrigger, hook } = setup();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);
    checkbox.focus();
    act(() => hook.result.current.reportDetailView());
    advance(15_500);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it.each(['search', 'email', 'number'])('waits while a %s input is focused', (type) => {
    const { onTrigger, hook } = setup();
    const input = document.createElement('input');
    input.type = type;
    document.body.appendChild(input);
    input.focus();
    act(() => hook.result.current.reportDetailView());
    advance(40_000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('waits while a textarea or contenteditable is focused', () => {
    const { onTrigger, hook } = setup();
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    act(() => hook.result.current.reportDetailView());
    advance(40_000);
    expect(onTrigger).not.toHaveBeenCalled();

    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    editable.tabIndex = 0;
    document.body.appendChild(editable);
    editable.focus();
    advance(5_000);
    expect(onTrigger).not.toHaveBeenCalled();

    act(() => editable.blur());
    advance(1_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('waits while a modal dialog is open', () => {
    const { onTrigger, hook } = setup();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);
    act(() => hook.result.current.reportDetailView());
    advance(40_000);
    expect(onTrigger).not.toHaveBeenCalled();
    act(() => dialog.remove());
    advance(1_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});

describe('FeedbackEngagementProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
  });
  afterEach(() => vi.useRealTimers());

  it('exposes sticky triggered after the detail dwell', () => {
    let ctx!: ReturnType<typeof useFeedbackEngagement>;
    function Probe() {
      ctx = useFeedbackEngagement();
      return null;
    }
    render(
      <FeedbackEngagementProvider>
        <Probe />
      </FeedbackEngagementProvider>,
    );
    expect(ctx.triggered).toBe(false);
    act(() => ctx.reportDetailView());
    advance(16_000);
    expect(ctx.triggered).toBe(true);
    act(() => ctx.leaveDetailView());
    expect(ctx.triggered).toBe(true);
  });

  it('returns a no-op value outside a provider', () => {
    const { result } = renderHook(() => useFeedbackEngagement());
    expect(result.current.triggered).toBe(false);
    expect(() => result.current.reportDetailView()).not.toThrow();
  });
});
