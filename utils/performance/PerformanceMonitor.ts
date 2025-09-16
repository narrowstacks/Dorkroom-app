/* ------------------------------------------------------------------ *\
   PerformanceMonitor.ts
   -------------------------------------------------------------
   Core performance monitoring utilities for border calculator optimization
   -------------------------------------------------------------
   Provides:
     - Real-time performance metrics collection
     - Memory usage tracking
     - Calculation timing measurements
     - Performance regression detection
\* ------------------------------------------------------------------ */

import { Platform } from "react-native";

export interface PerformanceMetrics {
  calculationTime: number;
  memoryUsage: number;
  frameDrops: number;
  cacheHitRate: number;
  renderTime: number;
  timestamp: number;
}

export interface CalculationMetrics {
  geometryCalculationTime: number;
  dimensionCalculationTime: number;
  warningCalculationTime: number;
  totalCalculationTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss?: number; // Node.js only
  jsHeapSizeLimit?: number; // Web only
  usedJSHeapSize?: number; // Web only
  totalJSHeapSize?: number; // Web only
}

export interface AnimationMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  animationDuration: number;
  engineType: "reanimated" | "web" | "legacy";
}

export interface PerformanceThresholds {
  maxCalculationTime: number;
  maxMemoryIncrease: number;
  minFps: number;
  maxFrameTime: number;
  minCacheHitRate: number;
}

export interface PerformanceAlert {
  type: "calculation" | "memory" | "animation" | "cache";
  severity: "warning" | "error" | "critical";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class PerformanceMonitorImpl {
  private isMonitoring = false;
  private metrics: PerformanceMetrics[] = [];
  private calculationMetrics: CalculationMetrics[] = [];
  private memoryBaseline: number = 0;
  private frameDropCounter = 0;
  private lastFrameTime = 0;
  private animationStartTime = 0;
  private thresholds: PerformanceThresholds = {
    maxCalculationTime: 50, // ms
    maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
    minFps: 30,
    maxFrameTime: 33.33, // ~30fps
    minCacheHitRate: 0.7, // 70%
  };
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  constructor() {
    this.setupMemoryBaseline();
  }

  private setupMemoryBaseline() {
    const memory = this.getMemoryUsage();
    this.memoryBaseline = memory.heapUsed || memory.usedJSHeapSize || 0;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupMemoryBaseline();

    if (__DEV__) {
      console.log("🔍 Performance monitoring started");
    }
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;

    if (__DEV__) {
      console.log("🔍 Performance monitoring stopped");
    }
  }

  public setThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  private emitAlert(alert: PerformanceAlert): void {
    this.alertCallbacks.forEach((callback) => callback(alert));

    if (__DEV__) {
      const emoji =
        alert.severity === "critical"
          ? "🚨"
          : alert.severity === "error"
            ? "⚠️"
            : "⚡";
      console.warn(
        `${emoji} Performance Alert [${alert.type}]: ${alert.message}`,
      );
    }
  }

  public getMemoryUsage(): MemoryMetrics {
    if (Platform.OS === "web") {
      // Web performance API
      const memory = (performance as any).memory;
      if (memory) {
        return {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
        };
      }
    }

    // React Native - approximate memory tracking
    // Note: React Native doesn't expose direct memory APIs
    // We'll use performance.now() and estimate based on object counts
    return {
      heapUsed: this.estimateMemoryUsage(),
      heapTotal: 0,
      external: 0,
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on metrics array size and calculation complexity
    const metricsSize = this.metrics.length * 200; // ~200 bytes per metric
    const calculationSize = this.calculationMetrics.length * 150;
    return metricsSize + calculationSize;
  }

  public measureCalculation<T>(
    name: string,
    calculation: () => T,
    category: "geometry" | "dimension" | "warning" | "total" = "total",
  ): T {
    if (!this.isMonitoring) {
      return calculation();
    }

    const startTime = performance.now();
    const result = calculation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record calculation metrics
    const currentMetrics = this.calculationMetrics[
      this.calculationMetrics.length - 1
    ] || {
      geometryCalculationTime: 0,
      dimensionCalculationTime: 0,
      warningCalculationTime: 0,
      totalCalculationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    const updatedMetrics = { ...currentMetrics };

    switch (category) {
      case "geometry":
        updatedMetrics.geometryCalculationTime += duration;
        break;
      case "dimension":
        updatedMetrics.dimensionCalculationTime += duration;
        break;
      case "warning":
        updatedMetrics.warningCalculationTime += duration;
        break;
      case "total":
        updatedMetrics.totalCalculationTime += duration;
        break;
    }

    this.calculationMetrics[this.calculationMetrics.length - 1] =
      updatedMetrics;

    // Check thresholds
    if (duration > this.thresholds.maxCalculationTime) {
      this.emitAlert({
        type: "calculation",
        severity:
          duration > this.thresholds.maxCalculationTime * 2
            ? "error"
            : "warning",
        message: `${name} calculation took ${duration.toFixed(2)}ms (threshold: ${this.thresholds.maxCalculationTime}ms)`,
        value: duration,
        threshold: this.thresholds.maxCalculationTime,
        timestamp: Date.now(),
      });
    }

    if (__DEV__ && duration > 10) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  public recordCacheHit(): void {
    if (!this.isMonitoring) return;

    const currentMetrics =
      this.calculationMetrics[this.calculationMetrics.length - 1];
    if (currentMetrics) {
      currentMetrics.cacheHits++;
    }
  }

  public recordCacheMiss(): void {
    if (!this.isMonitoring) return;

    const currentMetrics =
      this.calculationMetrics[this.calculationMetrics.length - 1];
    if (currentMetrics) {
      currentMetrics.cacheMisses++;
    }
  }

  public startCalculationBatch(): void {
    if (!this.isMonitoring) return;

    this.calculationMetrics.push({
      geometryCalculationTime: 0,
      dimensionCalculationTime: 0,
      warningCalculationTime: 0,
      totalCalculationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });
  }

  public endCalculationBatch(): CalculationMetrics | null {
    if (!this.isMonitoring || this.calculationMetrics.length === 0) return null;

    const metrics = this.calculationMetrics[this.calculationMetrics.length - 1];
    const memory = this.getMemoryUsage();
    const currentMemory = memory.heapUsed || memory.usedJSHeapSize || 0;
    const memoryIncrease = currentMemory - this.memoryBaseline;

    // Calculate cache hit rate
    const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0 ? metrics.cacheHits / totalCacheRequests : 1;

    // Record overall performance metrics
    this.metrics.push({
      calculationTime: metrics.totalCalculationTime,
      memoryUsage: currentMemory,
      frameDrops: this.frameDropCounter,
      cacheHitRate,
      renderTime: 0, // Will be updated by render measurements
      timestamp: Date.now(),
    });

    // Check memory threshold
    if (memoryIncrease > this.thresholds.maxMemoryIncrease) {
      this.emitAlert({
        type: "memory",
        severity:
          memoryIncrease > this.thresholds.maxMemoryIncrease * 2
            ? "critical"
            : "error",
        message: `Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (threshold: ${(this.thresholds.maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB)`,
        value: memoryIncrease,
        threshold: this.thresholds.maxMemoryIncrease,
        timestamp: Date.now(),
      });
    }

    // Check cache hit rate
    if (cacheHitRate < this.thresholds.minCacheHitRate) {
      this.emitAlert({
        type: "cache",
        severity: "warning",
        message: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}% (threshold: ${(this.thresholds.minCacheHitRate * 100).toFixed(1)}%)`,
        value: cacheHitRate,
        threshold: this.thresholds.minCacheHitRate,
        timestamp: Date.now(),
      });
    }

    // Keep only recent metrics (last 100 entries)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    if (this.calculationMetrics.length > 100) {
      this.calculationMetrics = this.calculationMetrics.slice(-100);
    }

    return metrics;
  }

  public measureAnimation(
    name: string,
    engineType: AnimationMetrics["engineType"],
    animationFn: () => void,
  ): Promise<AnimationMetrics> {
    return new Promise((resolve) => {
      if (!this.isMonitoring) {
        animationFn();
        resolve({
          fps: 0,
          frameTime: 0,
          droppedFrames: 0,
          animationDuration: 0,
          engineType,
        });
        return;
      }

      this.animationStartTime = performance.now();
      let frameCount = 0;
      let droppedFrames = 0;
      let lastFrameTime = this.animationStartTime;
      let totalFrameTime = 0;

      const measureFrame = () => {
        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;

        frameCount++;
        totalFrameTime += frameTime;

        if (frameTime > this.thresholds.maxFrameTime) {
          droppedFrames++;
        }

        lastFrameTime = currentTime;
      };

      // Hook into animation frames (platform-specific)
      let originalRAF: typeof requestAnimationFrame | null = null;
      if (
        Platform.OS === "web" &&
        typeof requestAnimationFrame !== "undefined"
      ) {
        originalRAF = requestAnimationFrame;
        (global as any).requestAnimationFrame = (
          callback: FrameRequestCallback,
        ) => {
          return originalRAF!(() => {
            measureFrame();
            callback(performance.now());
          });
        };
      }

      animationFn();

      // Calculate final metrics after animation completes
      setTimeout(() => {
        const totalTime = performance.now() - this.animationStartTime;
        const fps = frameCount > 0 ? (frameCount / totalTime) * 1000 : 0;
        const avgFrameTime = frameCount > 0 ? totalFrameTime / frameCount : 0;

        const metrics: AnimationMetrics = {
          fps,
          frameTime: avgFrameTime,
          droppedFrames,
          animationDuration: totalTime,
          engineType,
        };

        if (fps < this.thresholds.minFps) {
          this.emitAlert({
            type: "animation",
            severity: fps < this.thresholds.minFps * 0.5 ? "error" : "warning",
            message: `${name} animation FPS is ${fps.toFixed(1)} (threshold: ${this.thresholds.minFps})`,
            value: fps,
            threshold: this.thresholds.minFps,
            timestamp: Date.now(),
          });
        }

        if (__DEV__) {
          console.log(
            `🎬 ${name} [${engineType}]: ${fps.toFixed(1)}fps, ${droppedFrames} dropped frames, ${totalTime.toFixed(1)}ms duration`,
          );
        }

        // Restore original RAF
        if (originalRAF && Platform.OS === "web") {
          (global as any).requestAnimationFrame = originalRAF;
        }

        resolve(metrics);
      }, 100);
    });
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getCalculationMetrics(): CalculationMetrics[] {
    return [...this.calculationMetrics];
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        calculationTime: acc.calculationTime + metric.calculationTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        frameDrops: acc.frameDrops + metric.frameDrops,
        cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
        renderTime: acc.renderTime + metric.renderTime,
      }),
      {
        calculationTime: 0,
        memoryUsage: 0,
        frameDrops: 0,
        cacheHitRate: 0,
        renderTime: 0,
      },
    );

    const count = this.metrics.length;
    return {
      calculationTime: totals.calculationTime / count,
      memoryUsage: totals.memoryUsage / count,
      frameDrops: totals.frameDrops / count,
      cacheHitRate: totals.cacheHitRate / count,
      renderTime: totals.renderTime / count,
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.calculationMetrics = [];
    this.frameDropCounter = 0;
    this.setupMemoryBaseline();
  }

  public generateReport(): string {
    const avgMetrics = this.getAverageMetrics();
    const recentMetrics = this.metrics.slice(-10);
    const memory = this.getMemoryUsage();

    return `
Performance Report (${new Date().toISOString()})
================================================

Average Metrics (${this.metrics.length} samples):
- Calculation Time: ${avgMetrics.calculationTime?.toFixed(2)}ms
- Memory Usage: ${((avgMetrics.memoryUsage || 0) / 1024 / 1024).toFixed(2)}MB
- Cache Hit Rate: ${((avgMetrics.cacheHitRate || 0) * 100).toFixed(1)}%
- Frame Drops: ${avgMetrics.frameDrops?.toFixed(1)}

Current Memory:
- Heap Used: ${((memory.heapUsed || memory.usedJSHeapSize || 0) / 1024 / 1024).toFixed(2)}MB
- Baseline: ${(this.memoryBaseline / 1024 / 1024).toFixed(2)}MB
- Increase: ${(((memory.heapUsed || memory.usedJSHeapSize || 0) - this.memoryBaseline) / 1024 / 1024).toFixed(2)}MB

Recent Performance Trend:
${recentMetrics
  .map(
    (m, i) =>
      `${i + 1}. Calc: ${m.calculationTime.toFixed(1)}ms, Cache: ${(m.cacheHitRate * 100).toFixed(1)}%`,
  )
  .join("\n")}

Thresholds:
- Max Calculation Time: ${this.thresholds.maxCalculationTime}ms
- Max Memory Increase: ${(this.thresholds.maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB
- Min FPS: ${this.thresholds.minFps}
- Min Cache Hit Rate: ${(this.thresholds.minCacheHitRate * 100).toFixed(1)}%
    `.trim();
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceMonitorImpl();

// Hook for React components
export const usePerformanceMonitor = () => {
  return {
    startMonitoring: () => PerformanceMonitor.startMonitoring(),
    stopMonitoring: () => PerformanceMonitor.stopMonitoring(),
    measureCalculation:
      PerformanceMonitor.measureCalculation.bind(PerformanceMonitor),
    measureAnimation:
      PerformanceMonitor.measureAnimation.bind(PerformanceMonitor),
    getMetrics: () => PerformanceMonitor.getMetrics(),
    getAverageMetrics: () => PerformanceMonitor.getAverageMetrics(),
    generateReport: () => PerformanceMonitor.generateReport(),
    onAlert: PerformanceMonitor.onAlert.bind(PerformanceMonitor),
    setThresholds: PerformanceMonitor.setThresholds.bind(PerformanceMonitor),
  };
};
