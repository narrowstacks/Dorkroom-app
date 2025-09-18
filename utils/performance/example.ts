/* ------------------------------------------------------------------ *\
   example.ts
   -------------------------------------------------------------
   Example usage of performance monitoring for border calculator
   -------------------------------------------------------------
   Demonstrates:
     - Basic performance monitoring setup
     - Calculation measurement
     - Memory tracking
     - Report generation
\* ------------------------------------------------------------------ */

// This example can be run in development to verify performance monitoring works

import { PerformanceMonitor } from "./PerformanceMonitor";
import {
  PerformanceTestFramework,
  createCalculationBenchmark,
} from "./PerformanceTestFramework";
import {
  createBorderCalculatorBenchmarks,
  runBorderCalculatorBenchmarks,
} from "./BorderCalculatorBenchmarks";

// Example 1: Basic performance monitoring
export const basicPerformanceExample = () => {
  console.log("🚀 Starting basic performance monitoring example");

  // Start monitoring
  PerformanceMonitor.startMonitoring();

  // Set custom thresholds
  PerformanceMonitor.setThresholds({
    maxCalculationTime: 25,
    maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
    minCacheHitRate: 0.8,
  });

  // Set up alert handling
  const unsubscribe = PerformanceMonitor.onAlert((alert) => {
    console.warn(`⚠️ Performance Alert: ${alert.message}`);
  });

  // Start a calculation batch
  PerformanceMonitor.startCalculationBatch();

  // Measure some calculations
  const result1 = PerformanceMonitor.measureCalculation("simple-math", () => {
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += Math.sqrt(i);
    }
    return sum;
  });

  const result2 = PerformanceMonitor.measureCalculation(
    "complex-calculation",
    () => {
      const data = [];
      for (let i = 0; i < 500; i++) {
        data.push({
          id: i,
          value: Math.random() * 100,
          computed: Math.sin(i) * Math.cos(i),
        });
      }
      return data.reduce((sum, item) => sum + item.computed, 0);
    },
  );

  // Record some cache operations
  PerformanceMonitor.recordCacheHit();
  PerformanceMonitor.recordCacheHit();
  PerformanceMonitor.recordCacheMiss();

  // End the calculation batch
  const metrics = PerformanceMonitor.endCalculationBatch();

  console.log("📊 Calculation metrics:", metrics);
  console.log("📈 Average metrics:", PerformanceMonitor.getAverageMetrics());
  console.log("💾 Memory usage:", PerformanceMonitor.getMemoryUsage());

  // Generate and log report
  console.log("\n📋 Performance Report:");
  console.log(PerformanceMonitor.generateReport());

  // Cleanup
  unsubscribe();
  PerformanceMonitor.stopMonitoring();

  return { result1, result2, metrics };
};

// Example 2: Benchmark suite example
export const benchmarkSuiteExample = async () => {
  console.log("🏁 Starting benchmark suite example");

  // Create some simple benchmarks
  const benchmarks = [
    createCalculationBenchmark(
      "Array Processing",
      () => {
        const arr = new Array(1000).fill(0).map((_, i) => i);
        return arr
          .filter((x) => x % 2 === 0)
          .map((x) => x * 2)
          .reduce((a, b) => a + b, 0);
      },
      50,
    ),

    createCalculationBenchmark(
      "Object Creation",
      () => {
        const objects = [];
        for (let i = 0; i < 100; i++) {
          objects.push({
            id: i,
            name: `Item ${i}`,
            value: Math.random(),
            nested: {
              data: new Array(10).fill(i),
            },
          });
        }
        return objects.length;
      },
      30,
    ),

    createCalculationBenchmark(
      "String Operations",
      () => {
        let result = "";
        for (let i = 0; i < 100; i++) {
          result += `Item ${i} - ${Math.random().toFixed(3)}\n`;
        }
        return result.split("\n").length;
      },
      40,
    ),
  ];

  // Run the benchmark suite
  const results = await PerformanceTestFramework.runBenchmarkSuite(benchmarks);

  // Generate and display report
  console.log("\n📊 Benchmark Results:");
  console.log(PerformanceTestFramework.generateBenchmarkReport(results));

  // Set baseline for future regression testing
  PerformanceTestFramework.setBaseline(results);
  console.log("\n✅ Baseline established for future regression testing");

  return results;
};

// Example 3: Regression detection example
export const regressionDetectionExample = async () => {
  console.log("🔍 Starting regression detection example");

  // First, establish a baseline
  const baselineBenchmark = createCalculationBenchmark(
    "Regression Test",
    () => {
      // Simulate a calculation that might regress
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(i) * Math.sin(i);
      }
      return result;
    },
    20,
  );

  console.log("📊 Establishing baseline...");
  const baselineResults =
    await PerformanceTestFramework.runBenchmark(baselineBenchmark);
  PerformanceTestFramework.setBaseline([baselineResults]);

  // Simulate a "regression" by making the calculation slower
  const regressionBenchmark = createCalculationBenchmark(
    "Regression Test",
    () => {
      // Same calculation but with additional overhead
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(i) * Math.sin(i);
        // Add some overhead to simulate regression
        Math.random(); // Extra work
      }
      return result;
    },
    20,
  );

  console.log("🔍 Running current version...");
  const currentResults =
    await PerformanceTestFramework.runBenchmark(regressionBenchmark);

  // Detect regressions
  const regressions = PerformanceTestFramework.detectRegressions([
    currentResults,
  ]);

  console.log("\n📈 Regression Analysis:");
  console.log(PerformanceTestFramework.generateRegressionReport(regressions));

  return { baselineResults, currentResults, regressions };
};

// Example 4: Border calculator specific benchmarks
export const borderCalculatorExample = async () => {
  console.log("🖼️ Starting border calculator performance benchmarks");

  try {
    const results = await runBorderCalculatorBenchmarks();
    console.log("\n✅ Border calculator benchmarks completed successfully");
    return results;
  } catch (error) {
    console.error("❌ Border calculator benchmarks failed:", error);
    return null;
  }
};

// Main example runner
export const runAllExamples = async () => {
  console.log("🚀 Running all performance monitoring examples\n");

  try {
    console.log("=".repeat(60));
    await basicPerformanceExample();

    console.log("\n" + "=".repeat(60));
    await benchmarkSuiteExample();

    console.log("\n" + "=".repeat(60));
    await regressionDetectionExample();

    console.log("\n" + "=".repeat(60));
    await borderCalculatorExample();

    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Example execution failed:", error);
  }
};

// Export for use in development
if (typeof window !== "undefined" && (window as any).__DEV__) {
  (window as any).performanceExamples = {
    basic: basicPerformanceExample,
    benchmarks: benchmarkSuiteExample,
    regression: regressionDetectionExample,
    borderCalculator: borderCalculatorExample,
    runAll: runAllExamples,
  };

  console.log(
    "🔧 Performance examples available in window.performanceExamples",
  );
}
