/* ------------------------------------------------------------------ *\
   PerformanceDashboard.tsx
   -------------------------------------------------------------
   Development-only performance monitoring dashboard
   -------------------------------------------------------------
   Provides:
     - Real-time performance metrics display
     - Memory usage visualization
     - Performance alerts
     - Calculation timing analysis
\* ------------------------------------------------------------------ */

import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Badge,
  BadgeText,
  ScrollView,
} from "@gluestack-ui/themed";
import { usePerformanceMonitor } from "@/utils/performance/PerformanceMonitor";
import { useMemoryTracker } from "@/utils/performance/MemoryTracker";
import type { PerformanceAlert } from "@/utils/performance/PerformanceMonitor";
import type {
  MemoryLeak,
  MemoryPressureLevel,
} from "@/utils/performance/MemoryTracker";

interface PerformanceDashboardProps {
  visible?: boolean;
  onClose?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible = false,
  onClose,
}) => {
  const {
    getMetrics,
    getAverageMetrics,
    generateReport,
    onAlert,
    setThresholds,
  } = usePerformanceMonitor();

  const {
    getCurrentUsage,
    getMemoryIncrease,
    getTrend,
    generateReport: generateMemoryReport,
    onMemoryLeak,
    onMemoryPressure,
  } = useMemoryTracker({ enabled: visible });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [memoryLeaks, setMemoryLeaks] = useState<MemoryLeak[]>([]);
  const [memoryPressure, setMemoryPressure] =
    useState<MemoryPressureLevel | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to performance alerts
  useEffect(() => {
    const unsubscribe = onAlert((alert) => {
      setAlerts((prev) => [...prev.slice(-9), alert]); // Keep last 10 alerts
    });

    return unsubscribe;
  }, [onAlert]);

  // Subscribe to memory leak alerts
  useEffect(() => {
    const unsubscribe = onMemoryLeak((leak) => {
      setMemoryLeaks((prev) => [...prev.slice(-4), leak]); // Keep last 5 leaks
    });

    return unsubscribe;
  }, [onMemoryLeak]);

  // Subscribe to memory pressure alerts
  useEffect(() => {
    const unsubscribe = onMemoryPressure((pressure) => {
      setMemoryPressure(pressure);
    });

    return unsubscribe;
  }, [onMemoryPressure]);

  // Auto-refresh metrics every 2 seconds when visible
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || !__DEV__) {
    return null;
  }

  const avgMetrics = getAverageMetrics();
  const recentMetrics = getMetrics().slice(-5);
  const recentAlerts = alerts.slice(-3);

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(1)}ms`;
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "error":
        return "warning";
      default:
        return "info";
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const adjustThresholds = () => {
    // Example threshold adjustments for testing
    setThresholds({
      maxCalculationTime: 30,
      maxMemoryIncrease: 75 * 1024 * 1024,
      minFps: 45,
      minCacheHitRate: 0.8,
    });
  };

  return (
    <Box
      position="fixed"
      top={Platform.OS === "web" ? 10 : 50}
      right={10}
      width={isExpanded ? 350 : 200}
      maxHeight={isExpanded ? 500 : 150}
      backgroundColor="$backgroundLight950"
      borderRadius="$md"
      borderWidth={1}
      borderColor="$borderLight300"
      padding="$3"
      zIndex={9999}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
    >
      <VStack space="sm">
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$sm" fontWeight="$bold" color="$textLight900">
            Performance Monitor
          </Text>
          <HStack space="xs">
            <Button
              size="xs"
              variant="outline"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <ButtonText fontSize="$xs">
                {isExpanded ? "Collapse" : "Expand"}
              </ButtonText>
            </Button>
            {onClose && (
              <Button size="xs" variant="outline" onPress={onClose}>
                <ButtonText fontSize="$xs">×</ButtonText>
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Quick Stats */}
        <VStack space="xs">
          <HStack justifyContent="space-between">
            <Text fontSize="$xs" color="$textLight700">
              Avg Calc Time:
            </Text>
            <Text fontSize="$xs" fontWeight="$medium">
              {formatTime(avgMetrics.calculationTime || 0)}
            </Text>
          </HStack>

          <HStack justifyContent="space-between">
            <Text fontSize="$xs" color="$textLight700">
              Memory:
            </Text>
            <Text fontSize="$xs" fontWeight="$medium">
              {formatMemory(
                getCurrentUsage().heapUsed ||
                  getCurrentUsage().usedJSHeapSize ||
                  0,
              )}
            </Text>
          </HStack>

          <HStack justifyContent="space-between">
            <Text fontSize="$xs" color="$textLight700">
              Memory Trend:
            </Text>
            <Text
              fontSize="$xs"
              fontWeight="$medium"
              color={
                getTrend() === "increasing"
                  ? "$error600"
                  : getTrend() === "decreasing"
                    ? "$success600"
                    : "$textLight900"
              }
            >
              {getTrend()}
            </Text>
          </HStack>

          <HStack justifyContent="space-between">
            <Text fontSize="$xs" color="$textLight700">
              Cache Hit Rate:
            </Text>
            <Text fontSize="$xs" fontWeight="$medium">
              {((avgMetrics.cacheHitRate || 0) * 100).toFixed(1)}%
            </Text>
          </HStack>
        </VStack>

        {/* Alerts */}
        {recentAlerts.length > 0 && (
          <VStack space="xs">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$xs" fontWeight="$bold" color="$error600">
                Recent Alerts ({alerts.length})
              </Text>
              <Button size="xs" variant="link" onPress={clearAlerts}>
                <ButtonText fontSize="$xs">Clear</ButtonText>
              </Button>
            </HStack>

            {recentAlerts.map((alert, index) => (
              <Badge
                key={index}
                size="sm"
                variant="solid"
                action={getAlertColor(alert.severity)}
              >
                <BadgeText fontSize="$xs">
                  {alert.type}: {formatTime(alert.value)}
                </BadgeText>
              </Badge>
            ))}
          </VStack>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <VStack space="sm">
            {/* Recent Metrics Trend */}
            <VStack space="xs">
              <Text fontSize="$xs" fontWeight="$bold">
                Recent Trend:
              </Text>
              <ScrollView maxHeight={100}>
                {recentMetrics.map((metric, index) => (
                  <HStack key={index} justifyContent="space-between">
                    <Text fontSize="$xs" color="$textLight600">
                      #{recentMetrics.length - index}:
                    </Text>
                    <Text fontSize="$xs">
                      {formatTime(metric.calculationTime)} |
                      {((metric.cacheHitRate || 0) * 100).toFixed(0)}%
                    </Text>
                  </HStack>
                ))}
              </ScrollView>
            </VStack>

            {/* Controls */}
            <VStack space="xs">
              <Button size="xs" variant="outline" onPress={adjustThresholds}>
                <ButtonText fontSize="$xs">Adjust Thresholds</ButtonText>
              </Button>

              <Button
                size="xs"
                variant="outline"
                onPress={() => {
                  const report = generateReport();
                  console.log("📊 Performance Report:\n", report);
                }}
              >
                <ButtonText fontSize="$xs">Log Report</ButtonText>
              </Button>
            </VStack>

            {/* Platform Info */}
            <Text fontSize="$xs" color="$textLight500">
              Platform: {Platform.OS} | Samples: {getMetrics().length}
            </Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

// Hook to easily toggle the performance dashboard
export const usePerformanceDashboard = () => {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible((prev) => !prev);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return {
    visible,
    toggle,
    show,
    hide,
    PerformanceDashboard: (
      props: Omit<PerformanceDashboardProps, "visible" | "onClose">,
    ) => <PerformanceDashboard {...props} visible={visible} onClose={hide} />,
  };
};
