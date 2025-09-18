import "@/styles/global.css";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WebModalManager } from "@/components/ui/layout/ConfirmAlert";
import { useViewportHandler } from "@/hooks/useViewportHandler";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Add debugging for mobile web
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Dorkroom app initializing on:", navigator.userAgent);
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return <AppContent />;
}

function AppContent() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  // Activate viewport handler to fix iOS Safari viewport issues
  useViewportHandler();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* RESTORED: GluestackUIProvider needed for components */}
      <GluestackUIProvider
        config={config}
        colorMode={colorScheme === "dark" ? "dark" : "light"}
      >
        <View style={{ flex: 1 }}>
          <NavigationThemeProvider value={theme}>
            {/* TESTING: Stack replaced with simple View to test for container issues */}
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </View>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </NavigationThemeProvider>
          <WebModalManager />
        </View>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
