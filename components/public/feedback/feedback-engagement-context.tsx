'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useFeedbackTrigger } from './use-feedback-trigger';

export interface FeedbackEngagement {
  reportResultsInteraction(): void;
  reportDetailView(): void;
  leaveDetailView(): void;
  /** Sticky: true once the trigger rules have been met. */
  triggered: boolean;
}

const NOOP_VALUE: FeedbackEngagement = {
  reportResultsInteraction: () => {},
  reportDetailView: () => {},
  leaveDetailView: () => {},
  triggered: false,
};

const FeedbackEngagementContext = createContext<FeedbackEngagement>(NOOP_VALUE);

export function FeedbackEngagementProvider({ children }: { children: ReactNode }) {
  const [triggered, setTriggered] = useState(false);
  const onTrigger = useCallback(() => setTriggered(true), []);
  const { reportResultsInteraction, reportDetailView, leaveDetailView } =
    useFeedbackTrigger({ enabled: true, onTrigger });

  const value = useMemo<FeedbackEngagement>(
    () => ({
      reportResultsInteraction,
      reportDetailView,
      leaveDetailView,
      triggered,
    }),
    [reportResultsInteraction, reportDetailView, leaveDetailView, triggered],
  );

  return (
    <FeedbackEngagementContext.Provider value={value}>
      {children}
    </FeedbackEngagementContext.Provider>
  );
}

export function useFeedbackEngagement(): FeedbackEngagement {
  return useContext(FeedbackEngagementContext);
}
