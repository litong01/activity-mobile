import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  Activity,
  formatActivityTime,
  getActivityOrganizerName,
} from "@/types/Activity";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActivityItemProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
  /** When false, organizer name is hidden (e.g. for privacy on "Around me" tab). Default true. */
  showOrganizer?: boolean;
  /** When set, shown in the organizer row instead of organizer name (e.g. "Requesting to join"). */
  statusLabel?: string | null;
}

const activityIcons: Record<
  string,
  React.ComponentProps<typeof FontAwesome>["name"]
> = {
  tennis: "futbol-o",
  basketball: "futbol-o",
  sports: "futbol-o",
  music: "music",
  food: "cutlery",
  social: "users",
  outdoor: "tree",
  learning: "book",
  default: "calendar",
};

export default function ActivityItem({
  activity,
  onPress,
  showOrganizer = true,
  statusLabel,
}: ActivityItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.tint },
      ]}
      onPress={() => onPress(activity)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconPlaceholder, { backgroundColor: colors.tint }]}
        >
          <FontAwesome
            name={activityIcons[activity.type] || activityIcons.default}
            size={32}
            color="#fff"
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {activity.name}
        </Text>
        <Text
          style={[styles.typeText, { color: colors.tint }]}
          numberOfLines={1}
        >
          {activity.type}
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <FontAwesome name="clock-o" size={14} color={colors.tint} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {formatActivityTime(activity)}
            </Text>
          </View>

          {activity.location && (
            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={14} color={colors.tint} />
              <Text
                style={[styles.detailText, { color: colors.text }]}
                numberOfLines={1}
              >
                {activity.location}
              </Text>
            </View>
          )}
        </View>

        {showOrganizer && (
          <View style={styles.organizerRow}>
            <FontAwesome name="user" size={14} color={colors.tint} />
            <Text style={[styles.organizerText, { color: colors.text }]}>
              {statusLabel?.trim()
                ? statusLabel.trim()
                : getActivityOrganizerName(activity)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailsContainer: {
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizerText: {
    fontSize: 13,
    marginLeft: 6,
    fontStyle: "italic",
  },
});
