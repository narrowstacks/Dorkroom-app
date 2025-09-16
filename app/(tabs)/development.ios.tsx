import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { FlaskConical, Database } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const developmentTools = [
  {
    name: "developmentRecipes",
    title: "Development Recipes",
    description:
      "Find and add development recipe combinations for black and white film",
    icon: FlaskConical,
    tintColor: "developmentRecipesTint",
  },
  {
    name: "infobase",
    title: "Infobase",
    description: "Reference database and information resources",
    icon: Database,
    tintColor: "infobaseTint",
  },
];

export default function DevelopmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { bottom } = useSafeAreaInsets();

  const navigateToTool = (toolName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/${toolName}` as any);
  };

  const styles = createDynamicStyles(colors, bottom);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Development Tools</Text>
          <Text style={styles.subtitle}>
            Resources for film development and reference information
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.toolList}>
          {developmentTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const tintColor =
              colors[tool.tintColor as keyof typeof colors] || colors.tint;

            return (
              <TouchableOpacity
                key={tool.name}
                style={[
                  styles.toolCard,
                  { borderLeftColor: tintColor },
                  index === developmentTools.length - 1 && styles.toolCardLast,
                ]}
                onPress={() => navigateToTool(tool.name)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: tintColor }]}
                >
                  <IconComponent size={24} color={colors.background} />
                </View>

                <View style={styles.toolInfo}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>

                <View style={styles.chevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createDynamicStyles = (
  colors: typeof Colors.light,
  bottomInset: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 16,
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
    toolList: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: bottomInset + 72,
    },
    toolCard: {
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
    toolCardLast: {
      marginBottom: 0,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    toolInfo: {
      flex: 1,
    },
    toolTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    toolDescription: {
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
    spacer: {
      flex: 1,
    },
  });
