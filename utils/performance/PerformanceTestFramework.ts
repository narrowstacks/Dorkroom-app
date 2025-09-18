/* ------------------------------------------------------------------ *\
   PerformanceTestFramework.ts
   -------------------------------------------------------------
   Performance regression testing framework for border calculator
   -------------------------------------------------------------
   Provides:
     - Automated performance benchmarks
     - Regression detection
     - Baseline establishment
     - Cross-platform performance comparison
\* ------------------------------------------------------------------ */

import { Platform } from "react-native";
import {
  PerformanceMonitor,
  PerformanceMetrics,
  CalculationMetrics,
} from "./PerformanceMonitor";

export interface PerformanceBenchmark {
  name: string;
  category: "calculation" | "animation" | "memory" | "rendering";
  platform: string;
  iterations: number;
  setup?: () => void;
  teardown?: () => void;
  test: () => void;
}

export interface BenchmarkResult {
  name: string;
  category: string;
  platform: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  memoryUsage: number;
  cacheHitRate: number;
  timestamp: number;
  passed: boolean;
  threshold: number;
}

export interface PerformanceBaseline {
  [benchmarkName: string]: {
    averageTime: number;
    memoryUsage: number;
    platform: string;
    timestamp: number;
  };
}

export interface RegressionResult {
  benchmark: string;
  current: number;
  baseline: number;
  regression: number; // percentage
  isRegression: boolean;
  severity: "minor" | "major" | "critical";
}

class PerformanceTestFrameworkImpl {
  private baselines: PerformanceBaseline = {};
  private results: BenchmarkResult[] = [];
  private regressionThreshold = 0.2; // 20% regression threshold

  public setRegressionThreshold(threshold: number): void {
    this.regressionThreshold = threshold;
  }

  public async runBenchmark(
    benchmark: PerformanceBenchmark,
  ): Promise<BenchmarkResult> {
    console.log(
      `🏃‍♂️ Running benchmark: ${benchmark.name} (${benchmark.iterations} iterations)`,
    );

    // Setup
    if (benchmark.setup) {
      benchmark.setup();
    }

    PerformanceMonitor.startMonitoring();
    PerformanceMonitor.clearMetrics();

    const times: number[] = [];
    const memoryReadings: number[] = [];

    // Run iterations
    for (let i = 0; i < benchmark.iterations; i++) {
      PerformanceMonitor.startCalculationBatch();

      const startTime = performance.now();
      benchmark.test();
      const endTime = performance.now();

      const metrics = PerformanceMonitor.endCalculationBatch();

      times.push(endTime - startTime);

      const memory = PerformanceMonitor.getMemoryUsage();
      memoryReadings.push(memory.heapUsed || memory.usedJSHeapSize || 0);

      // Small delay to prevent overwhelming the system
      if (i < benchmark.iterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    PerformanceMonitor.stopMonitoring();

    // Cleanup
    if (benchmark.teardown) {
      benchmark.teardown();
    }

    // Calculate statistics
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Calculate standard deviation
    const variance =
      times.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) /
      times.length;
    const standardDeviation = Math.sqrt(variance);

    const averageMemory =
      memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;

    // Get cache hit rate from performance monitor
    const avgMetrics = PerformanceMonitor.getAverageMetrics();
    const cacheHitRate = avgMetrics.cacheHitRate || 0;

    // Determine if benchmark passed (based on category-specific thresholds)
    const threshold = this.getThresholdForCategory(benchmark.category);
    const passed = averageTime <= threshold;

    const result: BenchmarkResult = {
      name: benchmark.name,
      category: benchmark.category,
      platform: Platform.OS,
      iterations: benchmark.iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      memoryUsage: averageMemory,
      cacheHitRate,
      timestamp: Date.now(),
      passed,
      threshold,
    };

    this.results.push(result);

    console.log(`✅ Benchmark completed: ${benchmark.name}`);
    console.log(
      `   Average: ${averageTime.toFixed(2)}ms (threshold: ${threshold}ms)`,
    );
    console.log(`   Memory: ${(averageMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Cache Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%`);
    console.log(`   Status: ${passed ? "✅ PASSED" : "❌ FAILED"}`);

    return result;
  }

  private getThresholdForCategory(category: string): number {
    switch (category) {
      case "calculation":
        return 50; // 50ms for calculations
      case "animation":
        return 16.67; // ~60fps
      case "memory":
        return 100; // 100ms for memory operations
      case "rendering":
        return 33.33; // ~30fps
      default:
        return 100;
    }
  }

  public async runBenchmarkSuite(
    benchmarks: PerformanceBenchmark[],
  ): Promise<BenchmarkResult[]> {
    console.log(
      `🏁 Running performance benchmark suite (${benchmarks.length} benchmarks)`,
    );

    const results: BenchmarkResult[] = [];

    for (const benchmark of benchmarks) {
      try {
        const result = await this.runBenchmark(benchmark);
        results.push(result);
      } catch (error) {
        console.error(`❌ Benchmark failed: ${benchmark.name}`, error);
      }
    }

    console.log(
      `🏁 Benchmark suite completed: ${results.filter((r) => r.passed).length}/${results.length} passed`,
    );

    return results;
  }

  public setBaseline(results: BenchmarkResult[]): void {
    console.log("📊 Setting performance baseline");

    this.baselines = {};

    for (const result of results) {
      this.baselines[result.name] = {
        averageTime: result.averageTime,
        memoryUsage: result.memoryUsage,
        platform: result.platform,
        timestamp: result.timestamp,
      };
    }

    console.log(
      `📊 Baseline set for ${Object.keys(this.baselines).length} benchmarks`,
    );
  }

  public detectRegressions(
    currentResults: BenchmarkResult[],
  ): RegressionResult[] {
    const regressions: RegressionResult[] = [];

    for (const result of currentResults) {
      const baseline = this.baselines[result.name];

      if (!baseline) {
        console.warn(`⚠️ No baseline found for benchmark: ${result.name}`);
        continue;
      }

      // Only compare results from the same platform
      if (baseline.platform !== result.platform) {
        continue;
      }

      const regression =
        (result.averageTime - baseline.averageTime) / baseline.averageTime;
      const isRegression = regression > this.regressionThreshold;

      let severity: RegressionResult["severity"] = "minor";
      if (regression > 0.5) severity = "critical";
      else if (regression > 0.3) severity = "major";

      regressions.push({
        benchmark: result.name,
        current: result.averageTime,
        baseline: baseline.averageTime,
        regression: regression * 100,
        isRegression,
        severity,
      });

      if (isRegression) {
        console.warn(`📈 Performance regression detected in ${result.name}:`);
        console.warn(`   Current: ${result.averageTime.toFixed(2)}ms`);
        console.warn(`   Baseline: ${baseline.averageTime.toFixed(2)}ms`);
        console.warn(
          `   Regression: ${(regression * 100).toFixed(1)}% (${severity})`,
        );
      }
    }

    return regressions;
  }

  public generateBenchmarkReport(results: BenchmarkResult[]): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    const byCategory = results.reduce(
      (acc, result) => {
        if (!acc[result.category]) acc[result.category] = [];
        acc[result.category].push(result);
        return acc;
      },
      {} as Record<string, BenchmarkResult[]>,
    );

    let report = `
Performance Benchmark Report
============================
Date: ${new Date().toISOString()}
Platform: ${Platform.OS}
Total Benchmarks: ${results.length}
Passed: ${passed}
Failed: ${failed}

Summary by Category:
`;

    for (const [category, categoryResults] of Object.entries(byCategory)) {
      const categoryPassed = categoryResults.filter((r) => r.passed).length;
      const avgTime =
        categoryResults.reduce((sum, r) => sum + r.averageTime, 0) /
        categoryResults.length;
      const avgMemory =
        categoryResults.reduce((sum, r) => sum + r.memoryUsage, 0) /
        categoryResults.length;

      report += `
${category.toUpperCase()}:
  Tests: ${categoryResults.length} (${categoryPassed} passed)
  Average Time: ${avgTime.toFixed(2)}ms
  Average Memory: ${(avgMemory / 1024 / 1024).toFixed(2)}MB
`;
    }

    report += `

Detailed Results:
`;

    for (const result of results) {
      const status = result.passed ? "✅" : "❌";
      report += `
${status} ${result.name}
  Time: ${result.averageTime.toFixed(2)}ms (±${result.standardDeviation.toFixed(2)}ms)
  Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms
  Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB
  Cache Hit Rate: ${(result.cacheHitRate * 100).toFixed(1)}%
  Threshold: ${result.threshold}ms
  Iterations: ${result.iterations}
`;
    }

    return report;
  }

  public generateRegressionReport(regressions: RegressionResult[]): string {
    const significantRegressions = regressions.filter((r) => r.isRegression);

    let report = `
Performance Regression Report
=============================
Date: ${new Date().toISOString()}
Total Benchmarks Analyzed: ${regressions.length}
Regressions Detected: ${significantRegressions.length}
Regression Threshold: ${(this.regressionThreshold * 100).toFixed(1)}%

`;

    if (significantRegressions.length === 0) {
      report += "✅ No performance regressions detected!\n";
      return report;
    }

    const bySeverity = significantRegressions.reduce(
      (acc, reg) => {
        if (!acc[reg.severity]) acc[reg.severity] = [];
        acc[reg.severity].push(reg);
        return acc;
      },
      {} as Record<string, RegressionResult[]>,
    );

    for (const [severity, severityRegressions] of Object.entries(bySeverity)) {
      const emoji =
        severity === "critical" ? "🚨" : severity === "major" ? "⚠️" : "⚡";
      report += `${emoji} ${severity.toUpperCase()} REGRESSIONS (${severityRegressions.length}):\n`;

      for (const reg of severityRegressions) {
        report += `  ${reg.benchmark}: ${reg.current.toFixed(2)}ms (was ${reg.baseline.toFixed(2)}ms) - ${reg.regression.toFixed(1)}% slower\n`;
      }
      report += "\n";
    }

    return report;
  }

  public getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  public getBaselines(): PerformanceBaseline {
    return { ...this.baselines };
  }

  public clearResults(): void {
    this.results = [];
  }

  public saveBaselines(): string {
    return JSON.stringify(this.baselines, null, 2);
  }

  public loadBaselines(baselinesJson: string): void {
    try {
      this.baselines = JSON.parse(baselinesJson);
      console.log(
        `📊 Loaded baselines for ${Object.keys(this.baselines).length} benchmarks`,
      );
    } catch (error) {
      console.error("❌ Failed to load baselines:", error);
    }
  }
}

// Singleton instance
export const PerformanceTestFramework = new PerformanceTestFrameworkImpl();

// Utility function to create calculation benchmarks
export const createCalculationBenchmark = (
  name: string,
  calculationFn: () => void,
  iterations: number = 100,
): PerformanceBenchmark => ({
  name,
  category: "calculation",
  platform: Platform.OS,
  iterations,
  test: calculationFn,
});

// Utility function to create animation benchmarks
export const createAnimationBenchmark = (
  name: string,
  animationFn: () => void,
  iterations: number = 10,
): PerformanceBenchmark => ({
  name,
  category: "animation",
  platform: Platform.OS,
  iterations,
  test: animationFn,
});

// Utility function to create memory benchmarks
export const createMemoryBenchmark = (
  name: string,
  memoryTestFn: () => void,
  iterations: number = 50,
): PerformanceBenchmark => ({
  name,
  category: "memory",
  platform: Platform.OS,
  iterations,
  test: memoryTestFn,
});
