// lib/ThinkingContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type StepName = 'Classifying' | 'Summarizing' | 'Planning';
type ThinkingState = {
  running: boolean; completed: boolean; currentStep?: StepName;
  start: () => void; setStep: (s: StepName) => void; complete: () => void; reset: () => void;
};

const ThinkingContext = createContext<ThinkingState | null>(null);

export const ThinkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepName | undefined>(undefined);

  const start = useCallback(() => { setCompleted(false); setRunning(true); setCurrentStep('Classifying'); }, []);
  const setStep = useCallback((s: StepName) => setCurrentStep(s), []);
  const complete = useCallback(() => { setRunning(false); setCompleted(true); setCurrentStep(undefined); }, []);
  const reset = useCallback(() => { setRunning(false); setCompleted(false); setCurrentStep(undefined); }, []);

  const value = useMemo(() => ({ running, completed, currentStep, start, setStep, complete, reset }),
    [running, completed, currentStep, start, setStep, complete, reset]);

  return <ThinkingContext.Provider value={value}>{children}</ThinkingContext.Provider>;
};

export const useThinking = () => {
  const ctx = useContext(ThinkingContext);
  if (!ctx) throw new Error('useThinking must be used within ThinkingProvider');
  return ctx;
};
