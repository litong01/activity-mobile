import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { ActivitySyncProvider } from "@/contexts/ActivitySyncContext";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function CreateActivityFAB(
  props: React.ComponentProps<typeof View> & Record<string, unknown>
) {
  const { style, ...rest } = props;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  return (
    <View style={[styles.fabWrapper, style]} {...rest}>
      <Pressable
        onPress={() => router.push("/two?openCreate=1")}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: tint },
          pressed && styles.fabPressed,
        ]}
        accessibilityLabel="Create new activity"
        accessibilityRole="button"
      >
        <FontAwesome name="plus" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Platform.OS === "ios" ? -8 : 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ActivitySyncProvider>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Around me",
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "My Activity",
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "New Activity",
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <CreateActivityFAB {...props} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: "Tab Three",
          tabBarIcon: ({ color }) => <TabBarIcon name="star" color={color} />,
        }}
      />
      <Tabs.Screen
        name="four"
        options={{
          title: "Tab Four",
          tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
        }}
      />
    </Tabs>
    </ActivitySyncProvider>
  );
}
