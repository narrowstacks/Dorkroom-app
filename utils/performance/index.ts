/* ------------------------------------------------------------------ *\
   index.ts
   -------------------------------------------------------------
   Performance monitoring utilities index
   -------------------------------------------------------------
   Exports all performance monitoring tools for border calculator optimization
\* ------------------------------------------------------------------ */

// Core performance monitoring
export {
  PerformanceMonitor,
  usePerformanceMonitor,
  type PerformanceMetrics,
  type CalculationMetrics,
  type MemoryMetrics,
  type AnimationMetrics,
  type PerformanceThresholds,
  type PerformanceAlert,
} from "./PerformanceMonitor";

// Performance testing framework
export {
  PerformanceTestFramework,
  createCalculationBenchmark,
  createAnimationBenchmark,
  createMemoryBenchmark,
  type PerformanceBenchmark,
  type BenchmarkResult,
  type PerformanceBaseline,
  type RegressionResult,
} from "./PerformanceTestFramework";

// Border calculator specific benchmarks
export {
  createBorderCalculatorBenchmarks,
  runBorderCalculatorBenchmarks,
  establishPerformanceBaseline,
  checkPerformanceRegressions,
} from "./BorderCalculatorBenchmarks";

// Hook for border calculator performance monitoring
export {
  usePerformanceMonitoring,
  usePerformanceDebugger,
} from "../../hooks/borderCalculator/usePerformanceMonitoring";

// Examples and utilities
export {
  basicPerformanceExample,
  benchmarkSuiteExample,
  regressionDetectionExample,
  borderCalculatorExample,
  runAllExamples,
} from "./example";
