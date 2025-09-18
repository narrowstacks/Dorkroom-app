/* ------------------------------------------------------------------ *\
   BorderCalculatorBenchmarks.test.ts
   -------------------------------------------------------------
   Tests for border calculator performance benchmarks
   -------------------------------------------------------------
   Verifies:
     - Benchmark creation and execution
     - Performance baseline establishment
     - Regression detection
\* ------------------------------------------------------------------ */

// Mock React Native Platform
const mockPlatform = { OS: "web" };
jest.doMock("react-native", () => ({
  Platform: mockPlatform,
}));

import {
  createCalculationBenchmark,
  createAnimationBenchmark,
  createMemoryBenchmark,
  PerformanceTestFramework,
} from "../PerformanceTestFramework";

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

describe("BorderCalculatorBenchmarks", () => {
  beforeEach(() => {
    PerformanceTestFramework.clearResults();
    mockPerformanceNow.mockClear();
  });

  describe("Benchmark Creation", () => {
    it("should create calculation benchmarks", () => {
      const benchmark = createCalculationBenchmark(
        "test-calculation",
        () => {
          // Simple calculation
          return Math.sqrt(16);
        },
        10,
      );

      expect(benchmark.name).toBe("test-calculation");
      expect(benchmark.category).toBe("calculation");
      expect(benchmark.platform).toBe("web");
      expect(benchmark.iterations).toBe(10);
      expect(typeof benchmark.test).toBe("function");
    });

    it("should create animation benchmarks", () => {
      const benchmark = createAnimationBenchmark(
        "test-animation",
        () => {
          // Simple animation simulation
          for (let i = 0; i < 100; i++) {
            Math.sin(i * 0.1);
          }
        },
        5,
      );

      expect(benchmark.name).toBe("test-animation");
      expect(benchmark.category).toBe("animation");
      expect(benchmark.iterations).toBe(5);
    });

    it("should create memory benchmarks", () => {
      const benchmark = createMemoryBenchmark(
        "test-memory",
        () => {
          // Simple memory allocation
          const arr = new Array(1000).fill(0);
          arr.length = 0;
        },
        20,
      );

      expect(benchmark.name).toBe("test-memory");
      expect(benchmark.category).toBe("memory");
      expect(benchmark.iterations).toBe(20);
    });
  });

  describe("Benchmark Execution", () => {
    it("should run a simple calculation benchmark", async () => {
      const benchmark = createCalculationBenchmark(
        "simple-calc",
        () => {
          return 2 + 2;
        },
        5,
      );

      // Mock consistent timing
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(10) // First iteration
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20) // Second iteration
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(30) // Third iteration
        .mockReturnValueOnce(30)
        .mockReturnValueOnce(40) // Fourth iteration
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(50); // Fifth iteration

      const result = await PerformanceTestFramework.runBenchmark(benchmark);

      expect(result.name).toBe("simple-calc");
      expect(result.iterations).toBe(5);
      expect(result.averageTime).toBe(10); // Each iteration took 10ms
      expect(result.minTime).toBe(10);
      expect(result.maxTime).toBe(10);
      expect(result.passed).toBe(true); // Should pass threshold
    });

    it("should detect failing benchmarks", async () => {
      const benchmark = createCalculationBenchmark(
        "slow-calc",
        () => {
          // Simulate slow calculation
          return Math.random();
        },
        3,
      );

      // Mock slow timing (100ms per iteration, above 50ms threshold)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200)
        .mockReturnValueOnce(200)
        .mockReturnValueOnce(300);

      const result = await PerformanceTestFramework.runBenchmark(benchmark);

      expect(result.averageTime).toBe(100);
      expect(result.passed).toBe(false); // Should fail threshold
    });
  });

  describe("Baseline and Regression Detection", () => {
    it("should establish and use baselines", async () => {
      const benchmark = createCalculationBenchmark(
        "baseline-test",
        () => Math.sqrt(25),
        3,
      );

      // Mock baseline timing (20ms average)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(60);

      const baselineResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      PerformanceTestFramework.setBaseline([baselineResults]);

      // Mock current timing (30ms average - 50% regression)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(30)
        .mockReturnValueOnce(30)
        .mockReturnValueOnce(60)
        .mockReturnValueOnce(60)
        .mockReturnValueOnce(90);

      const currentResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      const regressions = PerformanceTestFramework.detectRegressions([
        currentResults,
      ]);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].benchmark).toBe("baseline-test");
      expect(regressions[0].isRegression).toBe(true);
      expect(regressions[0].regression).toBe(50); // 50% regression
      expect(regressions[0].severity).toBe("critical"); // > 50% is critical
    });

    it("should not detect regressions within threshold", async () => {
      const benchmark = createCalculationBenchmark(
        "stable-test",
        () => Math.sqrt(36),
        3,
      );

      // Mock baseline timing (20ms average)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(60);

      const baselineResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      PerformanceTestFramework.setBaseline([baselineResults]);

      // Mock current timing (22ms average - 10% regression, within 20% threshold)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(22)
        .mockReturnValueOnce(22)
        .mockReturnValueOnce(44)
        .mockReturnValueOnce(44)
        .mockReturnValueOnce(66);

      const currentResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      const regressions = PerformanceTestFramework.detectRegressions([
        currentResults,
      ]);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].isRegression).toBe(false); // Within threshold
    });
  });

  describe("Report Generation", () => {
    it("should generate benchmark reports", async () => {
      const benchmark1 = createCalculationBenchmark("test1", () => 1 + 1, 2);
      const benchmark2 = createCalculationBenchmark("test2", () => 2 + 2, 2);

      // Mock timing for both benchmarks
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(35)
        .mockReturnValueOnce(35)
        .mockReturnValueOnce(50);

      const results = await PerformanceTestFramework.runBenchmarkSuite([
        benchmark1,
        benchmark2,
      ]);
      const report = PerformanceTestFramework.generateBenchmarkReport(results);

      expect(report).toContain("Performance Benchmark Report");
      expect(report).toContain("Platform: web");
      expect(report).toContain("Total Benchmarks: 2");
      expect(report).toContain("test1");
      expect(report).toContain("test2");
      expect(report).toContain("CALCULATION:");
    });

    it("should generate regression reports", async () => {
      const benchmark = createCalculationBenchmark(
        "regression-test",
        () => 42,
        2,
      );

      // Baseline
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20);

      const baselineResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      PerformanceTestFramework.setBaseline([baselineResults]);

      // Current (with regression)
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(40)
        .mockReturnValueOnce(80);

      const currentResults =
        await PerformanceTestFramework.runBenchmark(benchmark);
      const regressions = PerformanceTestFramework.detectRegressions([
        currentResults,
      ]);
      const report =
        PerformanceTestFramework.generateRegressionReport(regressions);

      expect(report).toContain("Performance Regression Report");
      expect(report).toContain("Regressions Detected: 1");
      expect(report).toContain("regression-test");
      expect(report).toContain("300.0% slower"); // 40ms vs 10ms = 300% increase
    });
  });

  describe("Baseline Persistence", () => {
    it("should save and load baselines", async () => {
      const benchmark = createCalculationBenchmark(
        "persist-test",
        () => "test",
        1,
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(25);

      const results = await PerformanceTestFramework.runBenchmark(benchmark);
      PerformanceTestFramework.setBaseline([results]);

      const savedBaselines = PerformanceTestFramework.saveBaselines();
      expect(savedBaselines).toContain("persist-test");
      expect(savedBaselines).toContain("25"); // Average time

      // Clear and reload
      PerformanceTestFramework.clearResults();
      PerformanceTestFramework.loadBaselines(savedBaselines);

      const baselines = PerformanceTestFramework.getBaselines();
      expect(baselines["persist-test"]).toBeDefined();
      expect(baselines["persist-test"].averageTime).toBe(25);
    });
  });
});
