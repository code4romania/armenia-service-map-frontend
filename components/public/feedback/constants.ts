/**
 * Tunable thresholds for the public feedback pop-up trigger.
 * The client asked for the pop-up to appear right away once a visitor looks up
 * a service (searches/filters on /services or opens a service page); the short
 * dwell only lets the page render first.
 * NEXT_PUBLIC_FEEDBACK_TEST_DWELL_MS overrides both dwell times (e2e/staging).
 */
const testDwell = Number(process.env.NEXT_PUBLIC_FEEDBACK_TEST_DWELL_MS);
const hasTestDwell = Number.isFinite(testDwell) && testDwell > 0;

export const FEEDBACK_DETAIL_DWELL_MS = hasTestDwell ? testDwell : 1_000;
export const FEEDBACK_RESULTS_DWELL_MS = hasTestDwell ? testDwell : 1_000;
