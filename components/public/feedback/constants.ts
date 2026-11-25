/**
 * Tunable thresholds for the public feedback pop-up trigger.
 * NEXT_PUBLIC_FEEDBACK_TEST_DWELL_MS overrides both dwell times (e2e/staging).
 */
const testDwell = Number(process.env.NEXT_PUBLIC_FEEDBACK_TEST_DWELL_MS);
const hasTestDwell = Number.isFinite(testDwell) && testDwell > 0;

export const FEEDBACK_DETAIL_DWELL_MS = hasTestDwell ? testDwell : 15_000;
export const FEEDBACK_RESULTS_DWELL_MS = hasTestDwell ? testDwell : 30_000;
export const FEEDBACK_SCROLL_PX = 300;
