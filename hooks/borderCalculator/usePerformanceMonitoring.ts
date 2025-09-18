/* ------------------------------------------------------------------ *\
   usePerformanceMonitoring.ts
   -------------------------------------------------------------
   Performance monitoring hook for border calculator
   -------------------------------------------------------------
   Integrates performance monitoring into the border calculator hooks
   to track calculation times, memory usage, and detect performance issues
\* ------------------------------------------------------------------ */

import { useEffect, useRef, useCallback } from "react";
import {
  PerformanceMonitor,
  PerformanceAlert,
} from "@/utils/performance/PerformanceMonitor";
import type { BorderCalculatorState } from "./types";

interface PerformanceMonitoringOptions {
  enabled: boolean;
  trackCalculations: boolean;
  trackMemory: boolean;
  trackAnimations: boolean;
  alertThreshold: number;
}

interface PerformanceStats {
  averageCalculationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  alertCount: number;
  isMonitoring: boolean;
}

const DEFAULT_OPTIONS: PerformanceMonitoringOptions = {
  enabled: __DEV__, // Only enable in development by default
  trackCalculations: true,
  trackMemory: true,
  trackAnimations: true,
  alertThreshold: 50, // 50ms threshold for alerts
};

export const usePerformanceMonitoring = (
  state: BorderCalculatorState,
  options: Partial<PerformanceMonitoringOptions> = {},
) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const alertCountRef = useRef(0);
  const lastStateRef = useRef<BorderCalculatorState | null>(null);
  const calculationCountRef = useRef(0);

  // Start/stop monitoring based on enabled flag
  useEffect(() => {
    if (config.enabled) {
      PerformanceMonitor.startMonitoring();

      // Set thresholds
      PerformanceMonitor.setThresholds({
        maxCalculationTime: config.alertThreshold,
        maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
        minFps: 30,
        maxFrameTime: 33.33,
        minCacheHitRate: 0.7,
      });

      if (__DEV__) {
        console.log("🔍 Border calculator performance monitoring enabled");
      }
    } else {
      PerformanceMonitor.stopMonitoring();
    }

    return () => {
      if (config.enabled) {
        PerformanceMonitor.stopMonitoring();
      }
    };
  }, [config.enabled, config.alertThreshold]);

  // Set up alert handling
  useEffect(() => {
    if (!config.enabled) return;

    const unsubscribe = PerformanceMonitor.onAlert(
      (alert: PerformanceAlert) => {
        alertCountRef.current++;

        if (__DEV__) {
          const emoji =
            alert.severity === "critical"
              ? "🚨"
              : alert.severity === "error"
                ? "⚠️"
                : "⚡";
          console.warn(`${emoji} Border Calculator Performance Alert:`, {
            type: alert.type,
            message: alert.message,
            value: alert.value,
            threshold: alert.threshold,
          });
        }
      },
    );

    return unsubscribe;
  }, [config.enabled]);

  // Track state changes and trigger calculation measurements
  useEffect(() => {
    if (!config.enabled || !config.trackCalculations) return;

    const currentState = state;
    const lastState = lastStateRef.current;

    // Check if this is a state change that would trigger calculations
    if (lastState && hasSignificantStateChange(lastState, currentState)) {
      calculationCountRef.current++;

      // Start a new calculation batch
      PerformanceMonitor.startCalculationBatch();

      // The actual calculations will be measured by the calculation hooks
      // This just sets up the batch tracking

      if (__DEV__ && calculationCountRef.current % 10 === 0) {
        console.log(
          `📊 Border calculator: ${calculationCountRef.current} calculations tracked`,
        );
      }
    }

    lastStateRef.current = currentState;
  }, [state, config.enabled, config.trackCalculations]);

  // Wrapped calculation function with performance monitoring
  const measureCalculation = useCallback(
    <T>(
      name: string,
      calculationFn: () => T,
      category: "geometry" | "dimension" | "warning" = "geometry",
    ): T => {
      if (!config.enabled || !config.trackCalculations) {
        return calculationFn();
      }

      return PerformanceMonitor.measureCalculation(
        name,
        calculationFn,
        category,
      );
    },
    [config.enabled, config.trackCalculations],
  );

  // Wrapped animation function with performance monitoring
  const measureAnimation = useCallback(
    async (
      name: string,
      engineType: "reanimated" | "web" | "legacy",
      animationFn: () => void,
    ): Promise<void> => {
      if (!config.enabled || !config.trackAnimations) {
        animationFn();
        return;
      }

      await PerformanceMonitor.measureAnimation(name, engineType, animationFn);
    },
    [config.enabled, config.trackAnimations],
  );

  // Get current performance stats
  const getPerformanceStats = useCallback((): PerformanceStats => {
    if (!config.enabled) {
      return {
        averageCalculationTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        alertCount: 0,
        isMonitoring: false,
      };
    }

    const avgMetrics = PerformanceMonitor.getAverageMetrics();
    const memory = PerformanceMonitor.getMemoryUsage();

    return {
      averageCalculationTime: avgMetrics.calculationTime || 0,
      memoryUsage: memory.heapUsed || memory.usedJSHeapSize || 0,
      cacheHitRate: avgMetrics.cacheHitRate || 0,
      alertCount: alertCountRef.current,
      isMonitoring: true,
    };
  }, [config.enabled]);

  // Generate performance report
  const generateReport = useCallback((): string => {
    if (!config.enabled) {
      return "Performance monitoring is disabled";
    }

    return PerformanceMonitor.generateReport();
  }, [config.enabled]);

  // Clear performance metrics
  const clearMetrics = useCallback((): void => {
    if (config.enabled) {
      PerformanceMonitor.clearMetrics();
      alertCountRef.current = 0;
      calculationCountRef.current = 0;
    }
  }, [config.enabled]);

  // Record cache hit/miss for memoization tracking
  const recordCacheHit = useCallback((): void => {
    if (config.enabled) {
      PerformanceMonitor.recordCacheHit();
    }
  }, [config.enabled]);

  const recordCacheMiss = useCallback((): void => {
    if (config.enabled) {
      PerformanceMonitor.recordCacheMiss();
    }
  }, [config.enabled]);

  return {
    measureCalculation,
    measureAnimation,
    getPerformanceStats,
    generateReport,
    clearMetrics,
    recordCacheHit,
    recordCacheMiss,
    isEnabled: config.enabled,
  };
};

// Helper function to determine if a state change is significant enough to trigger calculations
function hasSignificantStateChange(
  prevState: BorderCalculatorState,
  currentState: BorderCalculatorState,
): boolean {
  // Check for changes that would trigger geometry calculations
  const geometryFields = [
    "aspectRatio",
    "paperSize",
    "customAspectWidth",
    "customAspectHeight",
    "customPaperWidth",
    "customPaperHeight",
    "minBorder",
    "horizontalOffset",
    "verticalOffset",
    "enableOffset",
    "ignoreMinBorder",
    "isLandscape",
    "isRatioFlipped",
  ] as const;

  return geometryFields.some(
    (field) => prevState[field] !== currentState[field],
  );
}

// Hook for development-only performance debugging
export const usePerformanceDebugger = () => {
  const stats = useRef<PerformanceStats[]>([]);

  const logPerformanceSnapshot = useCallback((label: string) => {
    if (!__DEV__) return;

    const memory = PerformanceMonitor.getMemoryUsage();
    const avgMetrics = PerformanceMonitor.getAverageMetrics();

    const snapshot: PerformanceStats = {
      averageCalculationTime: avgMetrics.calculationTime || 0,
      memoryUsage: memory.heapUsed || memory.usedJSHeapSize || 0,
      cacheHitRate: avgMetrics.cacheHitRate || 0,
      alertCount: 0,
      isMonitoring: true,
    };

    stats.current.push(snapshot);

    console.log(`📊 Performance Snapshot [${label}]:`, {
      calculationTime: `${snapshot.averageCalculationTime.toFixed(2)}ms`,
      memory: `${(snapshot.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      cacheHitRate: `${(snapshot.cacheHitRate * 100).toFixed(1)}%`,
    });
  }, []);

  const compareSnapshots = useCallback((label1: string, label2: string) => {
    if (!__DEV__ || stats.current.length < 2) return;

    const snapshot1 = stats.current[stats.current.length - 2];
    const snapshot2 = stats.current[stats.current.length - 1];

    const timeDiff =
      snapshot2.averageCalculationTime - snapshot1.averageCalculationTime;
    const memoryDiff = snapshot2.memoryUsage - snapshot1.memoryUsage;
    const cacheRateDiff = snapshot2.cacheHitRate - snapshot1.cacheHitRate;

    console.log(`📊 Performance Comparison [${label1} → ${label2}]:`, {
      calculationTime: `${timeDiff > 0 ? "+" : ""}${timeDiff.toFixed(2)}ms`,
      memory: `${memoryDiff > 0 ? "+" : ""}${(memoryDiff / 1024 / 1024).toFixed(2)}MB`,
      cacheHitRate: `${cacheRateDiff > 0 ? "+" : ""}${(cacheRateDiff * 100).toFixed(1)}%`,
    });
  }, []);

  const clearSnapshots = useCallback(() => {
    stats.current = [];
  }, []);

  return {
    logPerformanceSnapshot,
    compareSnapshots,
    clearSnapshots,
  };
};
