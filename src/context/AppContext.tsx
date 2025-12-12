import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import type { Photo } from "@/types/binder";

const STORAGE_KEY_UNSORTED = "app_unsorted_photos";
const STORAGE_KEY_PROGRESS = "app_daily_progress";

interface DailyProgress {
  date: string; // ISO date string (YYYY-MM-DD)
  initialCount: number; // Photos available at start of day
  organizedCount: number; // Photos organized so far
  isComplete: boolean;
}

interface AppContextType {
  // Unsorted photos
  unsortedPhotos: Photo[];
  addPhotos: (files: FileList) => number;
  removePhoto: (id: string) => void;
  removePhotos: (ids: string[]) => void;
  clearAllPhotos: () => void;
  unsortedCount: number;
  
  // Daily progress
  dailyProgress: DailyProgress;
  dailyGoal: number;
  incrementOrganizedCount: () => void;
  markDayComplete: () => void;
  resetDailyProgress: () => void;
  initializeDailySession: () => void;
  
  // Full reset
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultProgress(): DailyProgress {
  return {
    date: getTodayDateString(),
    initialCount: 0,
    organizedCount: 0,
    isComplete: false,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Load unsorted photos from localStorage on mount
  const [unsortedPhotos, setUnsortedPhotos] = useState<Photo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNSORTED);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load unsorted photos:", e);
    }
    return [];
  });

  // Load daily progress from localStorage on mount
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset if it's a new day
        if (parsed.date !== getTodayDateString()) {
          return getDefaultProgress();
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load daily progress:", e);
    }
    return getDefaultProgress();
  });

  // Persist unsorted photos to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNSORTED, JSON.stringify(unsortedPhotos));
    } catch (e) {
      console.error("Failed to save unsorted photos:", e);
    }
  }, [unsortedPhotos]);

  // Persist daily progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(dailyProgress));
    } catch (e) {
      console.error("Failed to save daily progress:", e);
    }
  }, [dailyProgress]);

  // Calculate daily goal: min of 10 or available photos
  const dailyGoal = useMemo(() => {
    return Math.min(10, dailyProgress.initialCount);
  }, [dailyProgress.initialCount]);

  // Initialize daily session when photos are available
  const initializeDailySession = useCallback(() => {
    setDailyProgress((prev) => {
      // Only initialize if not already set for today or if initialCount is 0
      if (prev.date === getTodayDateString() && prev.initialCount > 0) {
        return prev;
      }
      return {
        ...prev,
        date: getTodayDateString(),
        initialCount: unsortedPhotos.length,
      };
    });
  }, [unsortedPhotos.length]);

  const addPhotos = useCallback((files: FileList) => {
    const newPhotos: Photo[] = Array.from(files).map((file) => ({
      id: `unsorted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      alt: file.name,
    }));

    setUnsortedPhotos((prev) => [...prev, ...newPhotos]);
    
    // Update initial count if this is the first batch of photos for the day
    setDailyProgress((prev) => {
      if (prev.initialCount === 0 || prev.date !== getTodayDateString()) {
        return {
          date: getTodayDateString(),
          initialCount: newPhotos.length + (prev.date === getTodayDateString() ? prev.initialCount : 0),
          organizedCount: prev.date === getTodayDateString() ? prev.organizedCount : 0,
          isComplete: false,
        };
      }
      return {
        ...prev,
        initialCount: prev.initialCount + newPhotos.length,
      };
    });

    return newPhotos.length;
  }, []);

  const removePhoto = useCallback((id: string) => {
    setUnsortedPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Remove photos without revoking blob URLs (used when photos are moved to binders)
  const removePhotos = useCallback((ids: string[]) => {
    setUnsortedPhotos((prev) => {
      const idsSet = new Set(ids);
      return prev.filter((p) => !idsSet.has(p.id));
    });
  }, []);

  const clearAllPhotos = useCallback(() => {
    unsortedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
    setUnsortedPhotos([]);
  }, [unsortedPhotos]);

  const incrementOrganizedCount = useCallback(() => {
    setDailyProgress((prev) => ({
      ...prev,
      organizedCount: prev.organizedCount + 1,
    }));
  }, []);

  const markDayComplete = useCallback(() => {
    setDailyProgress((prev) => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  const resetDailyProgress = useCallback(() => {
    // Keep the organized count but mark as not complete to allow refill
    setDailyProgress((prev) => ({
      ...prev,
      isComplete: false,
      // Update initial count to current unsorted photos
      initialCount: unsortedPhotos.length,
    }));
  }, [unsortedPhotos.length]);

  const resetAll = useCallback(() => {
    // Clear all unsorted photos
    unsortedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
    setUnsortedPhotos([]);
    
    // Reset daily progress
    setDailyProgress(getDefaultProgress());
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_UNSORTED);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    localStorage.removeItem("app_binders");
  }, [unsortedPhotos]);

  const value = useMemo(
    () => ({
      unsortedPhotos,
      addPhotos,
      removePhoto,
      removePhotos,
      clearAllPhotos,
      unsortedCount: unsortedPhotos.length,
      dailyProgress,
      dailyGoal,
      incrementOrganizedCount,
      markDayComplete,
      resetDailyProgress,
      initializeDailySession,
      resetAll,
    }),
    [
      unsortedPhotos,
      addPhotos,
      removePhoto,
      removePhotos,
      clearAllPhotos,
      dailyProgress,
      dailyGoal,
      incrementOrganizedCount,
      markDayComplete,
      resetDailyProgress,
      initializeDailySession,
      resetAll,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
