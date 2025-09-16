/* ------------------------------------------------------------------ *\
   PerformanceMonitor.test.ts
   -------------------------------------------------------------
   Tests for performance monitoring utilities
   -------------------------------------------------------------
   Verifies:
     - Performance metrics collection
     - Memory usage tracking
     - Calculation timing measurements
     - Alert system functionality
\* ------------------------------------------------------------------ */

// Mock React Native Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

import { PerformanceMonitor } from "../PerformanceMonitor";

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, "performance", {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
    },
  },
  writable: true,
});

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
    PerformanceMonitor.stopMonitoring();
    mockPerformanceNow.mockClear();
  });

  afterEach(() => {
    PerformanceMonitor.stopMonitoring();
  });

  describe("Basic Monitoring", () => {
    it("should start and stop monitoring", () => {
      expect(() => {
        PerformanceMonitor.startMonitoring();
        PerformanceMonitor.stopMonitoring();
      }).not.toThrow();
    });

    it("should handle multiple start/stop calls gracefully", () => {
      PerformanceMonitor.startMonitoring();
      PerformanceMonitor.startMonitoring(); // Should not throw
      PerformanceMonitor.stopMonitoring();
      PerformanceMonitor.stopMonitoring(); // Should not throw
    });
  });

  describe("Calculation Measurement", () => {
    beforeEach(() => {
      PerformanceMonitor.startMonitoring();
    });

    it("should measure calculation time", () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      const result = PerformanceMonitor.measureCalculation("test-calc", () => {
        return "test-result";
      });

      expect(result).toBe("test-result");
      expect(mockPerformanceNow).toHaveBeenCalledTimes(2);
    });

    it("should work when monitoring is disabled", () => {
      PerformanceMonitor.stopMonitoring();

      const result = PerformanceMonitor.measureCalculation("test-calc", () => {
        return "test-result";
      });

      expect(result).toBe("test-result");
      // Should not call performance.now when disabled
      expect(mockPerformanceNow).not.toHaveBeenCalled();
    });

    it("should handle calculation errors gracefully", () => {
      expect(() => {
        PerformanceMonitor.measureCalculation("error-calc", () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");
    });
  });

  describe("Memory Usage Tracking", () => {
    it("should get memory usage on web platform", () => {
      const memory = PerformanceMonitor.getMemoryUsage();

      expect(memory).toHaveProperty("usedJSHeapSize");
      expect(memory).toHaveProperty("totalJSHeapSize");
      expect(memory).toHaveProperty("jsHeapSizeLimit");
      expect(memory.usedJSHeapSize).toBe(50 * 1024 * 1024);
    });

    it("should handle missing memory API gracefully", () => {
      // Temporarily remove memory API
      const originalMemory = (global.performance as any).memory;
      delete (global.performance as any).memory;

      const memory = PerformanceMonitor.getMemoryUsage();

      expect(memory).toHaveProperty("heapUsed");
      expect(memory).toHaveProperty("heapTotal");
      expect(memory).toHaveProperty("external");

      // Restore memory API
      (global.performance as any).memory = originalMemory;
    });
  });

  describe("Cache Tracking", () => {
    beforeEach(() => {
      PerformanceMonitor.startMonitoring();
      PerformanceMonitor.startCalculationBatch();
    });

    it("should record cache hits and misses", () => {
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheMiss();

      const metrics = PerformanceMonitor.endCalculationBatch();

      expect(metrics).toBeTruthy();
      expect(metrics!.cacheHits).toBe(2);
      expect(metrics!.cacheMisses).toBe(1);
    });

    it("should calculate cache hit rate correctly", () => {
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.recordCacheMiss();

      const metrics = PerformanceMonitor.endCalculationBatch();
      const avgMetrics = PerformanceMonitor.getAverageMetrics();

      expect(avgMetrics.cacheHitRate).toBe(0.75); // 3 hits out of 4 total
    });
  });

  describe("Alert System", () => {
    beforeEach(() => {
      PerformanceMonitor.startMonitoring();
    });

    it("should emit alerts for slow calculations", (done) => {
      PerformanceMonitor.setThresholds({ maxCalculationTime: 10 });

      const unsubscribe = PerformanceMonitor.onAlert((alert) => {
        expect(alert.type).toBe("calculation");
        expect(alert.severity).toBe("warning");
        expect(alert.value).toBe(50);
        expect(alert.threshold).toBe(10);
        unsubscribe();
        done();
      });

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      PerformanceMonitor.measureCalculation("slow-calc", () => {
        return "result";
      });
    });

    it("should emit critical alerts for very slow calculations", (done) => {
      PerformanceMonitor.setThresholds({ maxCalculationTime: 10 });

      const unsubscribe = PerformanceMonitor.onAlert((alert) => {
        expect(alert.severity).toBe("error");
        unsubscribe();
        done();
      });

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(25); // 2.5x threshold

      PerformanceMonitor.measureCalculation("very-slow-calc", () => {
        return "result";
      });
    });

    it("should allow multiple alert subscribers", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = PerformanceMonitor.onAlert(callback1);
      const unsubscribe2 = PerformanceMonitor.onAlert(callback2);

      PerformanceMonitor.setThresholds({ maxCalculationTime: 10 });
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      PerformanceMonitor.measureCalculation("slow-calc", () => "result");

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });
  });

  describe("Metrics Collection", () => {
    beforeEach(() => {
      PerformanceMonitor.startMonitoring();
    });

    it("should collect and return metrics", () => {
      PerformanceMonitor.startCalculationBatch();
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(25);

      PerformanceMonitor.measureCalculation("test-calc", () => "result");
      PerformanceMonitor.endCalculationBatch();

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toHaveProperty("calculationTime");
      expect(metrics[0]).toHaveProperty("memoryUsage");
      expect(metrics[0]).toHaveProperty("timestamp");
    });

    it("should calculate average metrics correctly", () => {
      // Add multiple calculation batches
      for (let i = 0; i < 3; i++) {
        PerformanceMonitor.startCalculationBatch();
        mockPerformanceNow
          .mockReturnValueOnce(0)
          .mockReturnValueOnce((i + 1) * 10);

        PerformanceMonitor.measureCalculation(`calc-${i}`, () => "result");
        PerformanceMonitor.endCalculationBatch();
      }

      const avgMetrics = PerformanceMonitor.getAverageMetrics();
      expect(avgMetrics.calculationTime).toBe(20); // (10 + 20 + 30) / 3
    });

    it("should limit metrics history size", () => {
      // Add more than 100 metrics
      for (let i = 0; i < 105; i++) {
        PerformanceMonitor.startCalculationBatch();
        mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(10);

        PerformanceMonitor.measureCalculation(`calc-${i}`, () => "result");
        PerformanceMonitor.endCalculationBatch();
      }

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics).toHaveLength(100); // Should be limited to 100
    });
  });

  describe("Report Generation", () => {
    beforeEach(() => {
      PerformanceMonitor.startMonitoring();
    });

    it("should generate a performance report", () => {
      PerformanceMonitor.startCalculationBatch();
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(25);

      PerformanceMonitor.measureCalculation("test-calc", () => "result");
      PerformanceMonitor.recordCacheHit();
      PerformanceMonitor.endCalculationBatch();

      const report = PerformanceMonitor.generateReport();

      expect(report).toContain("Performance Report");
      expect(report).toContain("Average Metrics");
      expect(report).toContain("Current Memory");
      expect(report).toContain("Thresholds");
    });

    it("should include recent performance trend in report", () => {
      // Add multiple metrics for trend analysis
      for (let i = 0; i < 5; i++) {
        PerformanceMonitor.startCalculationBatch();
        mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(i * 10);

        PerformanceMonitor.measureCalculation(`calc-${i}`, () => "result");
        PerformanceMonitor.endCalculationBatch();
      }

      const report = PerformanceMonitor.generateReport();
      expect(report).toContain("Recent Performance Trend");
    });
  });

  describe("Threshold Management", () => {
    it("should allow setting custom thresholds", () => {
      const customThresholds = {
        maxCalculationTime: 100,
        maxMemoryIncrease: 200 * 1024 * 1024,
        minFps: 60,
        minCacheHitRate: 0.8,
      };

      expect(() => {
        PerformanceMonitor.setThresholds(customThresholds);
      }).not.toThrow();
    });

    it("should merge thresholds with existing ones", () => {
      PerformanceMonitor.setThresholds({ maxCalculationTime: 100 });
      PerformanceMonitor.setThresholds({ minFps: 60 });

      // Both thresholds should be active (tested via alert behavior)
      PerformanceMonitor.startMonitoring();

      const alertCallback = jest.fn();
      PerformanceMonitor.onAlert(alertCallback);

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(150);
      PerformanceMonitor.measureCalculation("slow-calc", () => "result");

      expect(alertCallback).toHaveBeenCalled();
    });
  });
});
