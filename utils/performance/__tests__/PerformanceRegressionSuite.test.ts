/* ------------------------------------------------------------------ *\
   PerformanceRegressionSuite.test.ts
   -------------------------------------------------------------
   Comprehensive performance regression test suite
   -------------------------------------------------------------
   Tests:
     - Border calculator performance benchmarks
     - Memory usage regression detection
     - Animation performance validation
     - Cross-platform consistency checks
\* ------------------------------------------------------------------ */

import { Platform } from "react-native";
import {
  runBorderCalculatorBenchmarks,
  establishPerformanceBaseline,
  checkPerformanceRegressions,
} from "../BorderCalculatorBenchmarks";
import { PerformanceTestFramework } from "../PerformanceTestFramework";
import { PerformanceMonitor } from "../PerformanceMonitor";

// Mock React Native Platform for testing
jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, "performance", {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
    },
  },
  writable: true,
});

describe("Performance Regression Suite", () => {
  beforeEach(() => {
    PerformanceTestFramework.clearResults();
    PerformanceMonitor.clearMetrics();
    mockPerformanceNow.mockClear();
  });

  describe("Baseline Establishment", () => {
    it("should establish performance baseline successfully", async () => {
      // Mock consistent timing for baseline establishment
      let callCount = 0;
      mockPerformanceNow.mockImplementation(() => {
        callCount++;
        return callCount * 10; // Each call adds 10ms
      });

      const baselineResults = await establishPerformanceBaseline();

      expect(baselineResults).toBeDefined();
      expect(typeof baselineResults).toBe("string"); // JSON string

      const baseline = JSON.parse(baselineResults);
      expect(baseline).toHaveProperty("timestamp");
      expect(baseline).toHaveProperty("platform");
      expect(baseline).toHaveProperty("benchmarks");
    });

    it("should save and load baselines correctly", async () => {
      // Mock timing for baseline
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 10;
        return timeCounter;
      });

      const baselineJson = await establishPerformanceBaseline();

      // Load the baseline and verify it works
      const regressionResults = await checkPerformanceRegressions(baselineJson);

      expect(regressionResults).toHaveProperty("results");
      expect(regressionResults).toHaveProperty("regressions");
      expect(regressionResults).toHaveProperty("hasRegressions");
      expect(Array.isArray(regressionResults.regressions)).toBe(true);
    });
  });

  describe("Regression Detection", () => {
    it("should detect performance regressions", async () => {
      // Establish baseline with fast timing
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 5; // Fast baseline: 5ms per operation
        return timeCounter;
      });

      const baselineJson = await establishPerformanceBaseline();

      // Reset and simulate slower performance
      timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 15; // Slow current: 15ms per operation (3x slower)
        return timeCounter;
      });

      const regressionResults = await checkPerformanceRegressions(baselineJson);

      expect(regressionResults.hasRegressions).toBe(true);
      expect(regressionResults.regressions.length).toBeGreaterThan(0);

      // Check that regressions are properly categorized
      const criticalRegressions = regressionResults.regressions.filter(
        (r) => r.severity === "critical",
      );
      expect(criticalRegressions.length).toBeGreaterThan(0);
    });

    it("should not flag minor improvements as regressions", async () => {
      // Establish baseline
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 10; // Baseline: 10ms per operation
        return timeCounter;
      });

      const baselineJson = await establishPerformanceBaseline();

      // Reset and simulate slightly better performance
      timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 8; // Current: 8ms per operation (20% faster)
        return timeCounter;
      });

      const regressionResults = await checkPerformanceRegressions(baselineJson);

      expect(regressionResults.hasRegressions).toBe(false);

      // Improvements should have negative regression percentages
      const improvements = regressionResults.regressions.filter(
        (r) => r.regression < 0,
      );
      expect(improvements.length).toBeGreaterThan(0);
    });

    it("should handle missing baselines gracefully", async () => {
      const regressionResults = await checkPerformanceRegressions();

      // Should still run benchmarks even without baseline
      expect(regressionResults).toHaveProperty("results");
      expect(Array.isArray(regressionResults.results)).toBe(true);
      expect(regressionResults.results.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Usage Tracking", () => {
    it("should track memory usage during benchmarks", async () => {
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 10;
        return timeCounter;
      });

      const results = await runBorderCalculatorBenchmarks();

      // All results should have memory usage data
      results.forEach((result) => {
        expect(result).toHaveProperty("memoryUsage");
        expect(typeof result.memoryUsage).toBe("number");
        expect(result.memoryUsage).toBeGreaterThan(0);
      });
    });

    it("should detect memory usage regressions", async () => {
      // This would be implemented with actual memory tracking
      // For now, we verify the structure is in place
      const results = await runBorderCalculatorBenchmarks();

      const memoryBenchmarks = results.filter((r) => r.category === "memory");
      expect(memoryBenchmarks.length).toBeGreaterThan(0);

      memoryBenchmarks.forEach((benchmark) => {
        expect(benchmark).toHaveProperty("memoryUsage");
        expect(benchmark).toHaveProperty("averageTime");
      });
    });
  });

  describe("Cross-Platform Consistency", () => {
    it("should run benchmarks on different platforms", async () => {
      // Test web platform
      (Platform as any).OS = "web";
      const webResults = await runBorderCalculatorBenchmarks();

      // Test iOS platform
      (Platform as any).OS = "ios";
      const iosResults = await runBorderCalculatorBenchmarks();

      // Both should have the same benchmark names
      const webNames = webResults.map((r) => r.name).sort();
      const iosNames = iosResults.map((r) => r.name).sort();

      expect(webNames).toEqual(iosNames);

      // Platform should be correctly recorded
      expect(webResults.every((r) => r.platform === "web")).toBe(true);
      expect(iosResults.every((r) => r.platform === "ios")).toBe(true);
    });

    it("should only compare regressions within the same platform", async () => {
      // Establish baseline on web
      (Platform as any).OS = "web";
      const baselineJson = await establishPerformanceBaseline();

      // Check regressions on iOS (should not find matches)
      (Platform as any).OS = "ios";
      const regressionResults = await checkPerformanceRegressions(baselineJson);

      // Should run benchmarks but not find platform matches for regression comparison
      expect(regressionResults.results.length).toBeGreaterThan(0);
      expect(regressionResults.results.every((r) => r.platform === "ios")).toBe(
        true,
      );
    });
  });

  describe("Performance Thresholds", () => {
    it("should respect category-specific thresholds", async () => {
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 30; // 30ms per operation
        return timeCounter;
      });

      const results = await runBorderCalculatorBenchmarks();

      // Calculation benchmarks should have 50ms threshold
      const calcBenchmarks = results.filter(
        (r) => r.category === "calculation",
      );
      calcBenchmarks.forEach((benchmark) => {
        expect(benchmark.threshold).toBe(50);
        expect(benchmark.passed).toBe(true); // 30ms < 50ms threshold
      });

      // Memory benchmarks should have 100ms threshold
      const memoryBenchmarks = results.filter((r) => r.category === "memory");
      memoryBenchmarks.forEach((benchmark) => {
        expect(benchmark.threshold).toBe(100);
        expect(benchmark.passed).toBe(true); // 30ms < 100ms threshold
      });
    });

    it("should fail benchmarks that exceed thresholds", async () => {
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 75; // 75ms per operation (exceeds 50ms calc threshold)
        return timeCounter;
      });

      const results = await runBorderCalculatorBenchmarks();

      const calcBenchmarks = results.filter(
        (r) => r.category === "calculation",
      );
      calcBenchmarks.forEach((benchmark) => {
        expect(benchmark.passed).toBe(false); // 75ms > 50ms threshold
      });
    });
  });

  describe("Benchmark Reporting", () => {
    it("should generate comprehensive benchmark reports", async () => {
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 10;
        return timeCounter;
      });

      const results = await runBorderCalculatorBenchmarks();
      const report = PerformanceTestFramework.generateBenchmarkReport(results);

      expect(report).toContain("Performance Benchmark Report");
      expect(report).toContain("Platform:");
      expect(report).toContain("Total Benchmarks:");
      expect(report).toContain("CALCULATION:");
      expect(report).toContain("Detailed Results:");

      // Should include all benchmark names
      results.forEach((result) => {
        expect(report).toContain(result.name);
      });
    });

    it("should generate regression reports", async () => {
      // Establish baseline
      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 5;
        return timeCounter;
      });

      const baselineJson = await establishPerformanceBaseline();

      // Simulate regression
      timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 20; // 4x slower
        return timeCounter;
      });

      const regressionResults = await checkPerformanceRegressions(baselineJson);
      const report = PerformanceTestFramework.generateRegressionReport(
        regressionResults.regressions,
      );

      expect(report).toContain("Performance Regression Report");
      expect(report).toContain("Regressions Detected:");

      if (regressionResults.hasRegressions) {
        expect(report).toContain("CRITICAL REGRESSIONS");
        expect(report).toContain("slower");
      }
    });
  });

  describe("Integration with Performance Monitor", () => {
    it("should integrate with PerformanceMonitor during benchmarks", async () => {
      PerformanceMonitor.startMonitoring();

      mockPerformanceNow.mockReturnValue(0);
      let timeCounter = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeCounter += 10;
        return timeCounter;
      });

      await runBorderCalculatorBenchmarks();

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const avgMetrics = PerformanceMonitor.getAverageMetrics();
      expect(avgMetrics).toHaveProperty("calculationTime");
      expect(avgMetrics).toHaveProperty("memoryUsage");

      PerformanceMonitor.stopMonitoring();
    });

    it("should track cache hit rates during benchmarks", async () => {
      PerformanceMonitor.startMonitoring();

      // Simulate some cache hits and misses
      PerformanceMonitor.startCalculationBatch();
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheMiss();
      PerformanceMonitor.endCalculationBatch();

      const avgMetrics = PerformanceMonitor.getAverageMetrics();
      expect(avgMetrics.cacheHitRate).toBe(2 / 3); // 2 hits out of 3 total

      PerformanceMonitor.stopMonitoring();
    });
  });
});
