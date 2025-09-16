/* ------------------------------------------------------------------ *\
   BorderCalculatorBenchmarks.ts
   -------------------------------------------------------------
   Specific performance benchmarks for border calculator components
   -------------------------------------------------------------
   Provides:
     - Calculation performance benchmarks
     - Memory usage benchmarks
     - Animation performance tests
     - Baseline measurements
\* ------------------------------------------------------------------ */

import {
  PerformanceTestFramework,
  createCalculationBenchmark,
  createAnimationBenchmark,
  createMemoryBenchmark,
  PerformanceBenchmark,
} from "./PerformanceTestFramework";

// Import calculation functions to benchmark
import {
  findCenteringOffsets,
  calculateOptimalMinBorder,
  computePrintSize,
  clampOffsets,
  bordersFromGaps,
  bladeReadings,
  calculateBladeThickness,
} from "@/utils/borderCalculations";

// Import constants for test data
import { PAPER_SIZES, ASPECT_RATIOS } from "@/constants/border";

// Test data sets
const TEST_PAPER_SIZES = [
  { w: 8, h: 10 },
  { w: 11, h: 14 },
  { w: 16, h: 20 },
  { w: 20, h: 24 },
  { w: 5.5, h: 8.5 }, // Custom size
];

const TEST_ASPECT_RATIOS = [
  { w: 3, h: 2 },
  { w: 4, h: 3 },
  { w: 5, h: 4 },
  { w: 16, h: 9 },
  { w: 1, h: 1 }, // Square
];

const TEST_MIN_BORDERS = [0.5, 1.0, 1.5, 2.0, 2.5];

// Benchmark suite for border calculator
export const createBorderCalculatorBenchmarks = (): PerformanceBenchmark[] => {
  const benchmarks: PerformanceBenchmark[] = [];

  // 1. Core calculation benchmarks
  benchmarks.push(
    createCalculationBenchmark(
      "findCenteringOffsets - Standard Papers",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          findCenteringOffsets(paper.w, paper.h, true);
          findCenteringOffsets(paper.w, paper.h, false);
        });
      },
      200,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "calculateOptimalMinBorder - Various Ratios",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          TEST_ASPECT_RATIOS.forEach((ratio) => {
            TEST_MIN_BORDERS.forEach((minBorder) => {
              calculateOptimalMinBorder(
                paper.w,
                paper.h,
                ratio.w,
                ratio.h,
                minBorder,
              );
            });
          });
        });
      },
      50,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "computePrintSize - All Combinations",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          TEST_ASPECT_RATIOS.forEach((ratio) => {
            TEST_MIN_BORDERS.forEach((minBorder) => {
              computePrintSize(paper.w, paper.h, ratio.w, ratio.h, minBorder);
            });
          });
        });
      },
      100,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "clampOffsets - Offset Calculations",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          const printSize = computePrintSize(paper.w, paper.h, 3, 2, 1.0);
          [-2, -1, 0, 1, 2].forEach((hOffset) => {
            [-2, -1, 0, 1, 2].forEach((vOffset) => {
              clampOffsets(
                paper.w,
                paper.h,
                printSize.printW,
                printSize.printH,
                1.0,
                hOffset,
                vOffset,
                false,
              );
            });
          });
        });
      },
      150,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "bordersFromGaps - Border Calculations",
      () => {
        for (let i = 0; i < 100; i++) {
          const halfW = 4 + Math.random() * 6;
          const halfH = 5 + Math.random() * 7;
          const h = (Math.random() - 0.5) * 2;
          const v = (Math.random() - 0.5) * 2;
          bordersFromGaps(halfW, halfH, h, v);
        }
      },
      200,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "bladeReadings - Blade Position Calculations",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          const printSize = computePrintSize(paper.w, paper.h, 3, 2, 1.0);
          [-1, 0, 1].forEach((sX) => {
            [-1, 0, 1].forEach((sY) => {
              bladeReadings(printSize.printW, printSize.printH, sX, sY);
            });
          });
        });
      },
      200,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "calculateBladeThickness - Thickness Calculations",
      () => {
        TEST_PAPER_SIZES.forEach((paper) => {
          calculateBladeThickness(paper.w, paper.h);
        });
      },
      300,
    ),
  );

  // 2. Complex calculation chains (realistic usage)
  benchmarks.push(
    createCalculationBenchmark(
      "Full Calculation Chain - Typical Usage",
      () => {
        const paper = { w: 11, h: 14 };
        const ratio = { w: 3, h: 2 };
        const minBorder = 1.0;
        const hOffset = 0.5;
        const vOffset = -0.25;

        // Simulate full calculation chain
        const centeringOffsets = findCenteringOffsets(paper.w, paper.h, true);
        const optimalBorder = calculateOptimalMinBorder(
          paper.w,
          paper.h,
          ratio.w,
          ratio.h,
          minBorder,
        );
        const printSize = computePrintSize(
          paper.w,
          paper.h,
          ratio.w,
          ratio.h,
          optimalBorder,
        );
        const clampedOffsets = clampOffsets(
          paper.w,
          paper.h,
          printSize.printW,
          printSize.printH,
          optimalBorder,
          hOffset,
          vOffset,
          false,
        );
        const borders = bordersFromGaps(
          clampedOffsets.halfW,
          clampedOffsets.halfH,
          clampedOffsets.h,
          clampedOffsets.v,
        );
        const blades = bladeReadings(
          printSize.printW,
          printSize.printH,
          clampedOffsets.h,
          clampedOffsets.v,
        );
        const thickness = calculateBladeThickness(paper.w, paper.h);
      },
      100,
    ),
  );

  // 3. Memory usage benchmarks
  benchmarks.push(
    createMemoryBenchmark(
      "Memory Usage - Large Dataset Processing",
      () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
          const paper = TEST_PAPER_SIZES[i % TEST_PAPER_SIZES.length];
          const ratio = TEST_ASPECT_RATIOS[i % TEST_ASPECT_RATIOS.length];
          const minBorder = TEST_MIN_BORDERS[i % TEST_MIN_BORDERS.length];

          results.push({
            centeringOffsets: findCenteringOffsets(
              paper.w,
              paper.h,
              i % 2 === 0,
            ),
            printSize: computePrintSize(
              paper.w,
              paper.h,
              ratio.w,
              ratio.h,
              minBorder,
            ),
            bladeThickness: calculateBladeThickness(paper.w, paper.h),
          });
        }
        // Clear results to test memory cleanup
        results.length = 0;
      },
      10,
    ),
  );

  benchmarks.push(
    createMemoryBenchmark(
      "Memory Usage - Memoization Cache Stress Test",
      () => {
        // Test memoization cache with many unique inputs
        for (let i = 0; i < 500; i++) {
          const w = 5 + (i % 20) * 0.1;
          const h = 6 + (i % 25) * 0.1;
          findCenteringOffsets(w, h, i % 2 === 0);
        }
      },
      20,
    ),
  );

  // 4. Edge case performance tests
  benchmarks.push(
    createCalculationBenchmark(
      "Edge Cases - Extreme Values",
      () => {
        // Test with extreme values
        const extremeCases = [
          { w: 0.1, h: 0.1 },
          { w: 100, h: 100 },
          { w: 0.5, h: 50 },
          { w: 50, h: 0.5 },
        ];

        extremeCases.forEach((paper) => {
          try {
            findCenteringOffsets(paper.w, paper.h, true);
            computePrintSize(paper.w, paper.h, 1, 1, 0.1);
            calculateBladeThickness(paper.w, paper.h);
          } catch (error) {
            // Expected for some extreme cases
          }
        });
      },
      100,
    ),
  );

  benchmarks.push(
    createCalculationBenchmark(
      "Edge Cases - Zero and Negative Values",
      () => {
        const edgeCases = [
          { w: 0, h: 10 },
          { w: 10, h: 0 },
          { w: -1, h: 10 },
          { w: 10, h: -1 },
        ];

        edgeCases.forEach((paper) => {
          try {
            findCenteringOffsets(paper.w, paper.h, true);
            computePrintSize(paper.w, paper.h, 1, 1, 0.1);
          } catch (error) {
            // Expected for invalid inputs
          }
        });
      },
      100,
    ),
  );

  return benchmarks;
};

// Utility function to run all border calculator benchmarks
export const runBorderCalculatorBenchmarks = async () => {
  console.log("🚀 Starting Border Calculator Performance Benchmarks");

  const benchmarks = createBorderCalculatorBenchmarks();
  const results = await PerformanceTestFramework.runBenchmarkSuite(benchmarks);

  console.log("\n📊 Benchmark Results:");
  console.log(PerformanceTestFramework.generateBenchmarkReport(results));

  return results;
};

// Utility function to establish performance baseline
export const establishPerformanceBaseline = async () => {
  console.log("📊 Establishing performance baseline for border calculator");

  const results = await runBorderCalculatorBenchmarks();
  PerformanceTestFramework.setBaseline(results);

  console.log("✅ Performance baseline established");
  return PerformanceTestFramework.saveBaselines();
};

// Utility function to check for performance regressions
export const checkPerformanceRegressions = async (baselineJson?: string) => {
  console.log("🔍 Checking for performance regressions");

  if (baselineJson) {
    PerformanceTestFramework.loadBaselines(baselineJson);
  }

  const currentResults = await runBorderCalculatorBenchmarks();
  const regressions =
    PerformanceTestFramework.detectRegressions(currentResults);

  console.log("\n📈 Regression Analysis:");
  console.log(PerformanceTestFramework.generateRegressionReport(regressions));

  return {
    results: currentResults,
    regressions,
    hasRegressions: regressions.some((r) => r.isRegression),
  };
};
