import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="border">
        <Icon sf={{ default: "printer", selected: "printer.fill" }} />
        <Label>Borders</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shooting">
        <Icon sf={{ default: "camera", selected: "camera.fill" }} />
        <Label>Shooting</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="developmentRecipes">
        <Icon sf={{ default: "testtube.2", selected: "testtube.2" }} />
        <Label>Development</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gear", selected: "gear" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
