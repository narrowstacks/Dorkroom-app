/* ------------------------------------------------------------------ *\
   MemoryTracker.ts
   -------------------------------------------------------------
   Advanced memory usage tracking and leak detection
   -------------------------------------------------------------
   Provides:
     - Real-time memory usage monitoring
     - Memory leak detection
     - Memory pressure alerts
     - Cross-platform memory tracking
\* ------------------------------------------------------------------ */

import { Platform } from "react-native";

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss?: number; // Node.js only
  jsHeapSizeLimit?: number; // Web only
  usedJSHeapSize?: number; // Web only
  totalJSHeapSize?: number; // Web only
  arrayBuffers?: number; // Web only
}

export interface MemoryLeak {
  type: "gradual" | "sudden" | "persistent";
  severity: "minor" | "major" | "critical";
  startTime: number;
  endTime: number;
  memoryIncrease: number;
  description: string;
  snapshots: MemorySnapshot[];
}

export interface MemoryPressureLevel {
  level: "low" | "medium" | "high" | "critical";
  percentage: number;
  availableMemory: number;
  usedMemory: number;
  threshold: number;
}

class MemoryTrackerImpl {
  private snapshots: MemorySnapshot[] = [];
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private baselineMemory: number = 0;
  private leakDetectionThreshold = 50 * 1024 * 1024; // 50MB
  private maxSnapshots = 1000;
  private alertCallbacks: ((leak: MemoryLeak) => void)[] = [];
  private pressureCallbacks: ((pressure: MemoryPressureLevel) => void)[] = [];

  constructor() {
    this.establishBaseline();
  }

  private establishBaseline(): void {
    const snapshot = this.takeSnapshot();
    this.baselineMemory = snapshot.heapUsed || snapshot.usedJSHeapSize || 0;

    if (__DEV__) {
      console.log(
        `🧠 Memory baseline established: ${(this.baselineMemory / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }

  public startTracking(intervalMs: number = 5000): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.snapshots = [];
    this.establishBaseline();

    // Take initial snapshot
    this.snapshots.push(this.takeSnapshot());

    // Set up periodic tracking
    this.trackingInterval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      this.snapshots.push(snapshot);

      // Limit snapshot history
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.slice(-this.maxSnapshots);
      }

      // Check for memory leaks
      this.detectMemoryLeaks();

      // Check memory pressure
      this.checkMemoryPressure(snapshot);
    }, intervalMs);

    if (__DEV__) {
      console.log(`🧠 Memory tracking started (interval: ${intervalMs}ms)`);
    }
  }

  public stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (__DEV__) {
      console.log("🧠 Memory tracking stopped");
    }
  }

  public takeSnapshot(): MemorySnapshot {
    const timestamp = Date.now();

    if (Platform.OS === "web") {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          timestamp,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          arrayBuffers: memory.arrayBuffers || 0,
        };
      }
    }

    // React Native or fallback - estimate memory usage
    const estimatedMemory = this.estimateMemoryUsage();

    return {
      timestamp,
      heapUsed: estimatedMemory,
      heapTotal: estimatedMemory * 1.5, // Rough estimate
      external: 0,
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on various factors
    const snapshotSize = this.snapshots.length * 200; // ~200 bytes per snapshot
    const baseEstimate = 10 * 1024 * 1024; // 10MB base

    return baseEstimate + snapshotSize;
  }

  private detectMemoryLeaks(): void {
    if (this.snapshots.length < 10) return; // Need enough data points

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    if (older.length === 0) return;

    const recentAvg = this.calculateAverageMemory(recent);
    const olderAvg = this.calculateAverageMemory(older);
    const increase = recentAvg - olderAvg;

    // Detect gradual leaks
    if (increase > this.leakDetectionThreshold) {
      const leak: MemoryLeak = {
        type: "gradual",
        severity: this.categorizeSeverity(increase),
        startTime: older[0].timestamp,
        endTime: recent[recent.length - 1].timestamp,
        memoryIncrease: increase,
        description: `Gradual memory increase of ${(increase / 1024 / 1024).toFixed(2)}MB detected over ${recent.length} samples`,
        snapshots: [...older, ...recent],
      };

      this.emitLeakAlert(leak);
    }

    // Detect sudden spikes
    const lastSnapshot = recent[recent.length - 1];
    const previousSnapshot = recent[recent.length - 2];

    if (previousSnapshot) {
      const currentMemory =
        lastSnapshot.heapUsed || lastSnapshot.usedJSHeapSize || 0;
      const previousMemory =
        previousSnapshot.heapUsed || previousSnapshot.usedJSHeapSize || 0;
      const suddenIncrease = currentMemory - previousMemory;

      if (suddenIncrease > this.leakDetectionThreshold * 0.5) {
        // 50% of threshold for sudden spikes
        const leak: MemoryLeak = {
          type: "sudden",
          severity: this.categorizeSeverity(suddenIncrease),
          startTime: previousSnapshot.timestamp,
          endTime: lastSnapshot.timestamp,
          memoryIncrease: suddenIncrease,
          description: `Sudden memory spike of ${(suddenIncrease / 1024 / 1024).toFixed(2)}MB detected`,
          snapshots: [previousSnapshot, lastSnapshot],
        };

        this.emitLeakAlert(leak);
      }
    }
  }

  private calculateAverageMemory(snapshots: MemorySnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const total = snapshots.reduce((sum, snapshot) => {
      return sum + (snapshot.heapUsed || snapshot.usedJSHeapSize || 0);
    }, 0);

    return total / snapshots.length;
  }

  private categorizeSeverity(memoryIncrease: number): MemoryLeak["severity"] {
    const mb = memoryIncrease / 1024 / 1024;

    if (mb > 200) return "critical";
    if (mb > 100) return "major";
    return "minor";
  }

  private checkMemoryPressure(snapshot: MemorySnapshot): void {
    const currentMemory = snapshot.heapUsed || snapshot.usedJSHeapSize || 0;
    const totalMemory =
      snapshot.heapTotal || snapshot.totalJSHeapSize || currentMemory * 2;
    const limit = snapshot.jsHeapSizeLimit || 2 * 1024 * 1024 * 1024; // 2GB default

    const usagePercentage = (currentMemory / limit) * 100;

    let level: MemoryPressureLevel["level"] = "low";
    let threshold = 50; // 50% threshold for low

    if (usagePercentage > 90) {
      level = "critical";
      threshold = 90;
    } else if (usagePercentage > 75) {
      level = "high";
      threshold = 75;
    } else if (usagePercentage > 60) {
      level = "medium";
      threshold = 60;
    }

    if (level !== "low") {
      const pressure: MemoryPressureLevel = {
        level,
        percentage: usagePercentage,
        availableMemory: limit - currentMemory,
        usedMemory: currentMemory,
        threshold,
      };

      this.emitPressureAlert(pressure);
    }
  }

  private emitLeakAlert(leak: MemoryLeak): void {
    this.alertCallbacks.forEach((callback) => callback(leak));

    if (__DEV__) {
      const emoji =
        leak.severity === "critical"
          ? "🚨"
          : leak.severity === "major"
            ? "⚠️"
            : "💧";
      console.warn(`${emoji} Memory Leak Detected [${leak.type}]:`, {
        severity: leak.severity,
        increase: `${(leak.memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        duration: `${((leak.endTime - leak.startTime) / 1000).toFixed(1)}s`,
        description: leak.description,
      });
    }
  }

  private emitPressureAlert(pressure: MemoryPressureLevel): void {
    this.pressureCallbacks.forEach((callback) => callback(pressure));

    if (__DEV__) {
      const emoji =
        pressure.level === "critical"
          ? "🚨"
          : pressure.level === "high"
            ? "⚠️"
            : "📊";
      console.warn(`${emoji} Memory Pressure [${pressure.level}]:`, {
        usage: `${pressure.percentage.toFixed(1)}%`,
        used: `${(pressure.usedMemory / 1024 / 1024).toFixed(2)}MB`,
        available: `${(pressure.availableMemory / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }

  public onMemoryLeak(callback: (leak: MemoryLeak) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  public onMemoryPressure(
    callback: (pressure: MemoryPressureLevel) => void,
  ): () => void {
    this.pressureCallbacks.push(callback);
    return () => {
      const index = this.pressureCallbacks.indexOf(callback);
      if (index > -1) {
        this.pressureCallbacks.splice(index, 1);
      }
    };
  }

  public getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  public getCurrentMemoryUsage(): MemorySnapshot {
    return this.takeSnapshot();
  }

  public getMemoryIncrease(): number {
    const current = this.takeSnapshot();
    const currentMemory = current.heapUsed || current.usedJSHeapSize || 0;
    return currentMemory - this.baselineMemory;
  }

  public getMemoryTrend(
    samples: number = 10,
  ): "increasing" | "decreasing" | "stable" {
    if (this.snapshots.length < samples) return "stable";

    const recent = this.snapshots.slice(-samples);
    const older = this.snapshots.slice(-samples * 2, -samples);

    if (older.length === 0) return "stable";

    const recentAvg = this.calculateAverageMemory(recent);
    const olderAvg = this.calculateAverageMemory(older);
    const difference = recentAvg - olderAvg;
    const threshold = 5 * 1024 * 1024; // 5MB threshold

    if (difference > threshold) return "increasing";
    if (difference < -threshold) return "decreasing";
    return "stable";
  }

  public generateMemoryReport(): string {
    const current = this.takeSnapshot();
    const currentMemory = current.heapUsed || current.usedJSHeapSize || 0;
    const memoryIncrease = this.getMemoryIncrease();
    const trend = this.getMemoryTrend();

    const report = `
Memory Usage Report
==================
Date: ${new Date().toISOString()}
Platform: ${Platform.OS}

Current Memory Usage:
- Used: ${(currentMemory / 1024 / 1024).toFixed(2)}MB
- Baseline: ${(this.baselineMemory / 1024 / 1024).toFixed(2)}MB
- Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
- Trend: ${trend}

Tracking Status:
- Active: ${this.isTracking}
- Snapshots: ${this.snapshots.length}
- Duration: ${this.snapshots.length > 0 ? ((Date.now() - this.snapshots[0].timestamp) / 1000 / 60).toFixed(1) : 0} minutes

Memory Limits:
- JS Heap Limit: ${current.jsHeapSizeLimit ? (current.jsHeapSizeLimit / 1024 / 1024 / 1024).toFixed(2) + "GB" : "Unknown"}
- Total JS Heap: ${current.totalJSHeapSize ? (current.totalJSHeapSize / 1024 / 1024).toFixed(2) + "MB" : "Unknown"}

Recent Snapshots (last 5):
${this.snapshots
  .slice(-5)
  .map((snapshot, index) => {
    const memory = snapshot.heapUsed || snapshot.usedJSHeapSize || 0;
    const time = new Date(snapshot.timestamp).toLocaleTimeString();
    return `${index + 1}. ${time}: ${(memory / 1024 / 1024).toFixed(2)}MB`;
  })
  .join("\n")}

Recommendations:
${memoryIncrease > 100 * 1024 * 1024 ? "⚠️ High memory usage detected - consider implementing memory optimizations" : ""}
${trend === "increasing" ? "📈 Memory usage is trending upward - monitor for potential leaks" : ""}
${this.snapshots.length > 500 ? "📊 Large number of snapshots - consider clearing old data" : ""}
    `.trim();

    return report;
  }

  public clearSnapshots(): void {
    this.snapshots = [];
    this.establishBaseline();

    if (__DEV__) {
      console.log("🧠 Memory snapshots cleared and baseline re-established");
    }
  }

  public setLeakDetectionThreshold(bytes: number): void {
    this.leakDetectionThreshold = bytes;

    if (__DEV__) {
      console.log(
        `🧠 Memory leak detection threshold set to ${(bytes / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }

  public forceGarbageCollection(): void {
    if (Platform.OS === "web" && (global as any).gc) {
      (global as any).gc();

      if (__DEV__) {
        console.log("🗑️ Forced garbage collection");
      }
    } else if (__DEV__) {
      console.warn("🗑️ Garbage collection not available on this platform");
    }
  }
}

// Singleton instance
export const MemoryTracker = new MemoryTrackerImpl();

// React hook for memory tracking
export const useMemoryTracker = (
  options: {
    enabled?: boolean;
    interval?: number;
    leakThreshold?: number;
  } = {},
) => {
  const {
    enabled = __DEV__,
    interval = 5000,
    leakThreshold = 50 * 1024 * 1024,
  } = options;

  React.useEffect(() => {
    if (!enabled) return;

    MemoryTracker.setLeakDetectionThreshold(leakThreshold);
    MemoryTracker.startTracking(interval);

    return () => {
      MemoryTracker.stopTracking();
    };
  }, [enabled, interval, leakThreshold]);

  return {
    takeSnapshot: () => MemoryTracker.takeSnapshot(),
    getCurrentUsage: () => MemoryTracker.getCurrentMemoryUsage(),
    getMemoryIncrease: () => MemoryTracker.getMemoryIncrease(),
    getTrend: () => MemoryTracker.getMemoryTrend(),
    generateReport: () => MemoryTracker.generateMemoryReport(),
    clearSnapshots: () => MemoryTracker.clearSnapshots(),
    forceGC: () => MemoryTracker.forceGarbageCollection(),
    onMemoryLeak: (callback: (leak: MemoryLeak) => void) =>
      MemoryTracker.onMemoryLeak(callback),
    onMemoryPressure: (callback: (pressure: MemoryPressureLevel) => void) =>
      MemoryTracker.onMemoryPressure(callback),
  };
};

// Import React for the hook
import React from "react";
