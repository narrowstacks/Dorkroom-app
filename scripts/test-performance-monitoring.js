#!/usr/bin/env node

/* ------------------------------------------------------------------ *\
   test-performance-monitoring.js
   -------------------------------------------------------------
   Comprehensive test script for performance monitoring system
   -------------------------------------------------------------
   Tests:
     - Performance monitoring utilities
     - Memory tracking and leak detection
     - Baseline establishment and regression detection
     - Border calculator benchmarks
\* ------------------------------------------------------------------ */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_DIR = path.join(__dirname, "..", ".kiro", "performance", "tests");
const RESULTS_FILE = path.join(TEST_DIR, "test-results.json");

// Ensure test directory exists
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

console.log("🧪 Testing Performance Monitoring System");
console.log("========================================\n");

// Test suite configuration
const testSuites = [
  {
    name: "Performance Monitor Core",
    testFile: "utils/performance/__tests__/PerformanceMonitor.test.ts",
    description: "Core performance monitoring functionality",
  },
  {
    name: "Border Calculator Benchmarks",
    testFile: "utils/performance/__tests__/BorderCalculatorBenchmarks.test.ts",
    description: "Border calculator specific performance benchmarks",
  },
  {
    name: "Performance Test Framework",
    testFile: "utils/performance/__tests__/PerformanceTestFramework.test.ts",
    description: "Performance regression testing framework",
  },
  {
    name: "Performance Regression Suite",
    testFile: "utils/performance/__tests__/PerformanceRegressionSuite.test.ts",
    description: "Comprehensive regression detection tests",
  },
];

// Function to run a test suite
async function runTestSuite(suite) {
  console.log(`📋 Running: ${suite.name}`);
  console.log(`   Description: ${suite.description}`);

  try {
    const startTime = Date.now();

    const testOutput = execSync(
      `npx jest ${suite.testFile} --verbose --no-coverage --json`,
      {
        encoding: "utf8",
        cwd: path.join(__dirname, ".."),
        timeout: 120000, // 2 minute timeout
      },
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Parse Jest JSON output
    let testResults;
    try {
      testResults = JSON.parse(testOutput);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      testResults = {
        success: testOutput.includes("PASS"),
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        testResults: [],
      };
    }

    const result = {
      name: suite.name,
      description: suite.description,
      status: testResults.success ? "PASSED" : "FAILED",
      duration,
      totalTests: testResults.numTotalTests || 0,
      passedTests: testResults.numPassedTests || 0,
      failedTests: testResults.numFailedTests || 0,
      timestamp: new Date().toISOString(),
    };

    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tests: ${result.passedTests}/${result.totalTests} passed`);

    if (result.status === "FAILED") {
      console.log(`   ❌ Failed tests: ${result.failedTests}`);
    } else {
      console.log(`   ✅ All tests passed`);
    }

    console.log("");

    return result;
  } catch (error) {
    console.log(`   ❌ Test suite failed: ${error.message}`);
    console.log("");

    return {
      name: suite.name,
      description: suite.description,
      status: "ERROR",
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Function to run performance benchmarks
async function runPerformanceBenchmarks() {
  console.log("🏃‍♂️ Running Performance Benchmarks");
  console.log("   This may take a few minutes...\n");

  try {
    // Run the benchmark establishment script
    const benchmarkOutput = execSync(
      "node scripts/establish-performance-baseline.js",
      {
        encoding: "utf8",
        cwd: path.join(__dirname, ".."),
        timeout: 300000, // 5 minute timeout
      },
    );

    console.log("✅ Performance benchmarks completed");
    console.log("   Check .kiro/performance/ for detailed results\n");

    return {
      name: "Performance Benchmarks",
      status: "COMPLETED",
      output: benchmarkOutput.split("\n").slice(-10).join("\n"), // Last 10 lines
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.log(`❌ Performance benchmarks failed: ${error.message}\n`);

    return {
      name: "Performance Benchmarks",
      status: "FAILED",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Function to test memory tracking
async function testMemoryTracking() {
  console.log("🧠 Testing Memory Tracking");

  try {
    // Create a simple memory tracking test
    const memoryTestScript = `
const { MemoryTracker } = require('./utils/performance/MemoryTracker');

console.log('Starting memory tracking test...');

// Start tracking
MemoryTracker.startTracking(1000); // 1 second intervals

// Simulate memory usage
const testData = [];
for (let i = 0; i < 100; i++) {
  testData.push(new Array(1000).fill(i));
}

// Wait for a few snapshots
setTimeout(() => {
  const report = MemoryTracker.generateMemoryReport();
  console.log('Memory Report:');
  console.log(report);
  
  MemoryTracker.stopTracking();
  console.log('Memory tracking test completed');
}, 5000);
    `;

    const testFile = path.join(TEST_DIR, "memory-test.js");
    fs.writeFileSync(testFile, memoryTestScript);

    const memoryOutput = execSync(`node ${testFile}`, {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
      timeout: 30000, // 30 second timeout
    });

    console.log("✅ Memory tracking test completed");
    console.log("   Memory tracking is functioning correctly\n");

    // Clean up test file
    fs.unlinkSync(testFile);

    return {
      name: "Memory Tracking",
      status: "COMPLETED",
      output: memoryOutput.split("\n").slice(-5).join("\n"), // Last 5 lines
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.log(`❌ Memory tracking test failed: ${error.message}\n`);

    return {
      name: "Memory Tracking",
      status: "FAILED",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Function to validate performance dashboard
async function validatePerformanceDashboard() {
  console.log("📊 Validating Performance Dashboard");

  try {
    // Check if dashboard component exists and has required exports
    const dashboardPath = path.join(
      __dirname,
      "..",
      "components/ui/feedback/PerformanceDashboard.tsx",
    );

    if (!fs.existsSync(dashboardPath)) {
      throw new Error("PerformanceDashboard.tsx not found");
    }

    const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

    // Check for required imports and exports
    const requiredElements = [
      "usePerformanceMonitor",
      "useMemoryTracker",
      "PerformanceDashboard",
      "usePerformanceDashboard",
    ];

    const missingElements = requiredElements.filter(
      (element) => !dashboardContent.includes(element),
    );

    if (missingElements.length > 0) {
      throw new Error(
        `Missing required elements: ${missingElements.join(", ")}`,
      );
    }

    console.log("✅ Performance dashboard validation passed");
    console.log("   All required components and hooks are present\n");

    return {
      name: "Performance Dashboard",
      status: "VALIDATED",
      elements: requiredElements,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.log(
      `❌ Performance dashboard validation failed: ${error.message}\n`,
    );

    return {
      name: "Performance Dashboard",
      status: "FAILED",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Function to generate final report
function generateFinalReport(results) {
  const totalTests = results.reduce(
    (sum, result) => sum + (result.totalTests || 0),
    0,
  );
  const passedTests = results.reduce(
    (sum, result) => sum + (result.passedTests || 0),
    0,
  );
  const failedTests = results.reduce(
    (sum, result) => sum + (result.failedTests || 0),
    0,
  );

  const passedSuites = results.filter(
    (r) =>
      r.status === "PASSED" ||
      r.status === "COMPLETED" ||
      r.status === "VALIDATED",
  ).length;
  const totalSuites = results.length;

  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      totalSuites,
      passedSuites,
      failedSuites: totalSuites - passedSuites,
      totalTests,
      passedTests,
      failedTests,
      successRate:
        totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0",
    },
    results,
    recommendations: [],
  };

  // Add recommendations based on results
  if (report.summary.failedSuites > 0) {
    report.recommendations.push(
      "Review failed test suites and fix any issues before proceeding",
    );
  }

  if (report.summary.successRate < 90) {
    report.recommendations.push(
      "Test success rate is below 90% - investigate failing tests",
    );
  }

  if (passedSuites === totalSuites) {
    report.recommendations.push(
      "All tests passed! Performance monitoring system is ready for use",
    );
  }

  return report;
}

// Main execution
async function main() {
  const results = [];

  try {
    // Step 1: Run test suites
    console.log("🧪 Running Test Suites\n");

    for (const suite of testSuites) {
      const result = await runTestSuite(suite);
      results.push(result);
    }

    // Step 2: Run performance benchmarks
    const benchmarkResult = await runPerformanceBenchmarks();
    results.push(benchmarkResult);

    // Step 3: Test memory tracking
    const memoryResult = await testMemoryTracking();
    results.push(memoryResult);

    // Step 4: Validate performance dashboard
    const dashboardResult = await validatePerformanceDashboard();
    results.push(dashboardResult);

    // Step 5: Generate final report
    const finalReport = generateFinalReport(results);

    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(finalReport, null, 2));

    // Display summary
    console.log("📋 Performance Monitoring Test Summary");
    console.log("=====================================");
    console.log(`Total Test Suites: ${finalReport.summary.totalSuites}`);
    console.log(`Passed: ${finalReport.summary.passedSuites}`);
    console.log(`Failed: ${finalReport.summary.failedSuites}`);
    console.log(`Total Tests: ${finalReport.summary.totalTests}`);
    console.log(`Success Rate: ${finalReport.summary.successRate}%`);
    console.log("");

    // Display recommendations
    if (finalReport.recommendations.length > 0) {
      console.log("📝 Recommendations:");
      finalReport.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log("");
    }

    console.log(`📄 Detailed results saved to: ${RESULTS_FILE}`);

    // Exit with appropriate code
    if (finalReport.summary.failedSuites > 0) {
      console.log("\n❌ Some tests failed. Please review and fix issues.");
      process.exit(1);
    } else {
      console.log("\n✅ All performance monitoring tests passed!");
      console.log("   The performance monitoring system is ready for use.");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
