import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Clock, Aperture } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const shootingCalculators = [
  {
    name: "reciprocity",
    title: "Reciprocity Calculator",
    description: "Compensate for film reciprocity failure at long exposures",
    icon: Clock,
    tintColor: "reciprocityCalcTint",
  },
  {
    name: "cameraExposure",
    title: "Camera Exposure Calculator",
    description:
      "Calculate exposure triangle relationships (aperture, shutter, ISO)",
    icon: Aperture,
    tintColor: "cameraExposureCalcTint",
  },
];

export default function ShootingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createDynamicStyles(colors);

  const navigateToCalculator = (calculatorName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/${calculatorName}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shooting Calculators</Text>
        <Text style={styles.subtitle}>
          Tools for camera exposure and film photography calculations
        </Text>
      </View>

      <View style={styles.calculatorList}>
        {shootingCalculators.map((calculator) => {
          const IconComponent = calculator.icon;
          const tintColor =
            colors[calculator.tintColor as keyof typeof colors] || colors.tint;

          return (
            <TouchableOpacity
              key={calculator.name}
              style={[styles.calculatorCard, { borderLeftColor: tintColor }]}
              onPress={() => navigateToCalculator(calculator.name)}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: tintColor }]}
              >
                <IconComponent size={24} color={colors.background} />
              </View>

              <View style={styles.calculatorInfo}>
                <Text style={styles.calculatorTitle}>{calculator.title}</Text>
                <Text style={styles.calculatorDescription}>
                  {calculator.description}
                </Text>
              </View>

              <View style={styles.chevron}>
                <Text style={styles.chevronText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const createDynamicStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.tabIconDefault,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
      lineHeight: 22,
    },
    calculatorList: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    calculatorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderLeftWidth: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    calculatorInfo: {
      flex: 1,
    },
    calculatorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    calculatorDescription: {
      fontSize: 14,
      color: colors.icon,
      lineHeight: 20,
    },
    chevron: {
      marginLeft: 12,
    },
    chevronText: {
      fontSize: 24,
      color: colors.icon,
      fontWeight: "300",
    },
  });
