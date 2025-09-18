import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  FrameIcon,
  TimerIcon,
  MoveIcon,
  CameraIcon,
  ClockIcon,
  FlaskConicalIcon,
  ZapIcon,
  GitBranchIcon,
  HeartIcon,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";

interface CalculatorCardProps {
  title: string;
  description: string;
  route: string;
  icon: React.ComponentType<any>;
  color: string;
  disabled?: boolean;
}

const CalculatorCard = ({
  title,
  description,
  route,
  icon: Icon,
  color,
  disabled,
}: CalculatorCardProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: color,
          },
        ]}
      >
        <Icon size={24} color="white" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
        {disabled && (
          <Text style={[styles.comingSoon, { color }]}>Coming Soon</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const calculators = [
    {
      title: "Border Calculator",
      description: "Calculate precise print borders",
      route: "/(tabs)/border",
      icon: FrameIcon,
      color: colors.borderCalcTint,
    },
    {
      title: "Stops Calculator",
      description: "Calculate exposure in stops and time",
      route: "/(tabs)/exposure",
      icon: TimerIcon,
      color: colors.stopCalcTint,
    },
    {
      title: "Resize Calculator",
      description: "Scale prints without recalculating exposure",
      route: "/(tabs)/resize",
      icon: MoveIcon,
      color: colors.resizeCalcTint,
    },
    {
      title: "Exposure Calculator",
      description: "Aperture, shutter, ISO trade-offs",
      route: "/(tabs)/cameraExposure",
      icon: CameraIcon,
      color: colors.cameraExposureCalcTint,
    },
    {
      title: "Reciprocity",
      description: "Correct for long exposure failure",
      route: "/(tabs)/reciprocity",
      icon: ClockIcon,
      color: colors.reciprocityCalcTint,
    },
    {
      title: "Dev Dilution",
      description: "Mix developer chemistry precisely",
      route: "#",
      icon: FlaskConicalIcon,
      color: "#666",
      disabled: true,
    },
    {
      title: "Push/Pull",
      description: "Adjust development for exposure",
      route: "#",
      icon: ZapIcon,
      color: "#666",
      disabled: true,
    },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Dorkroom</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        Film photography calculators for the darkroom
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={[styles.footerTitle, { color: colors.text }]}>
        Support the Project
      </Text>
      <TouchableOpacity
        style={[styles.linkButton, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <GitBranchIcon size={16} color={colors.text} />
        <Text style={[styles.linkText, { color: colors.text }]}>
          Contribute on GitHub
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.linkButton, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <HeartIcon size={16} color="#FF5E5B" />
        <Text style={[styles.linkText, { color: colors.text }]}>
          Support on Ko-fi
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={calculators}
        renderItem={({ item }) => <CalculatorCard {...item} />}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});
