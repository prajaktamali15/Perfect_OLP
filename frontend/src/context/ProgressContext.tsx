"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ProgressData {
  [courseId: number]: number; // courseId -> progress %
}

interface ProgressContextType {
  progressMap: ProgressData; // renamed from "progress"
  updateProgress: (courseId: number, value: number) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progressMap, setProgressMap] = useState<ProgressData>({});

  const updateProgress = (courseId: number, value: number) => {
    setProgressMap((prev) => ({ ...prev, [courseId]: value }));
  };

  return (
    <ProgressContext.Provider value={{ progressMap, updateProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
