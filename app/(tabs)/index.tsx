import ActivityDetailBottomSheet from "@/components/ActivityDetailBottomSheet";
import ActivityItem from "@/components/ActivityItem";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { apiService } from "@/services/api.service";
import { Activity } from "@/types/Activity";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Mock data - this will be replaced with API calls
const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Morning Yoga Session",
    description:
      "Join us for a relaxing morning yoga session at the park. All levels welcome!",
    time: "Today, 8:00 AM",
    location: "Central Park, North Meadow",
    organizerName: "Sarah Johnson",
    activityType: "outdoor",
    isParticipant: false,
    participantCount: 8,
    maxParticipants: 15,
    comments: [],
  },
  {
    id: "2",
    title: "Coffee & Code Meetup",
    description:
      "Casual coding meetup for developers. Bring your laptop and projects!",
    time: "Today, 2:00 PM",
    location: "Starbucks Downtown",
    organizerName: "Mike Chen",
    activityType: "learning",
    isParticipant: true,
    participantCount: 12,
    maxParticipants: 20,
    comments: [
      {
        id: "c1",
        userId: "u1",
        userName: "Alex Kim",
        text: "Looking forward to this! Anyone working on React Native?",
        timestamp: "2 hours ago",
      },
      {
        id: "c2",
        userId: "u2",
        userName: "Mike Chen",
        text: "I'll bring some project ideas to discuss!",
        timestamp: "1 hour ago",
      },
    ],
  },
  {
    id: "3",
    title: "Basketball Pickup Game",
    description: "Weekly basketball game. Come play and meet new friends!",
    time: "Tomorrow, 6:00 PM",
    location: "Riverside Courts",
    organizerName: "James Williams",
    activityType: "sports",
    isParticipant: false,
    participantCount: 10,
    maxParticipants: 10,
    comments: [],
  },
  {
    id: "4",
    title: "Live Jazz Night",
    description: "Enjoy an evening of smooth jazz with local artists.",
    time: "Friday, 8:00 PM",
    location: "Blue Note Jazz Club",
    organizerName: "Emily Davis",
    activityType: "music",
    isParticipant: false,
    participantCount: 45,
    comments: [],
  },
  {
    id: "5",
    title: "Food Truck Festival",
    description:
      "Explore cuisines from around the world with over 20 food trucks!",
    time: "Saturday, 12:00 PM",
    location: "Harbor Front",
    organizerName: "City Events",
    activityType: "food",
    isParticipant: true,
    participantCount: 234,
    comments: [
      {
        id: "c3",
        userId: "u3",
        userName: "Sarah Lee",
        text: "Can't wait! I heard the Thai food truck is amazing!",
        timestamp: "3 hours ago",
      },
    ],
  },
  {
    id: "6",
    title: "Board Game Night",
    description:
      "Weekly board game gathering. We have tons of games or bring your own!",
    time: "Saturday, 7:00 PM",
    location: "The Game Lounge",
    organizerName: "Alex Martinez",
    activityType: "social",
    isParticipant: false,
    participantCount: 16,
    maxParticipants: 25,
    comments: [],
  },
];

export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, []);

  /**
   * Load activities from API
   */
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to load activities:", error);
      Alert.alert(
        "Error",
        "Failed to load activities. Please check your backend server is running.",
        [{ text: "OK" }],
      );
      // Fallback to mock data if API fails
      setActivities(INITIAL_ACTIVITIES);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh activities (pull to refresh)
   */
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await apiService.getActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to refresh activities:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) {
      return activities;
    }

    const query = searchQuery.toLowerCase();
    return activities.filter(
      (activity) =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.location.toLowerCase().includes(query) ||
        activity.organizerName.toLowerCase().includes(query) ||
        activity.activityType.toLowerCase().includes(query),
    );
  }, [searchQuery, activities]);

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseBottomSheet = () => {
    setSelectedActivity(null);
  };

  const handleJoin = async (activityId: string) => {
    try {
      await apiService.joinActivity(activityId);

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                isParticipant: true,
                participantCount: (activity.participantCount || 0) + 1,
              }
            : activity,
        ),
      );
      // Update selected activity as well
      if (selectedActivity?.id === activityId) {
        setSelectedActivity((prev) =>
          prev
            ? {
                ...prev,
                isParticipant: true,
                participantCount: (prev.participantCount || 0) + 1,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to join activity:", error);
      Alert.alert("Error", "Failed to join activity. Please try again.");
    }
  };

  const handleLeave = async (activityId: string) => {
    try {
      await apiService.leaveActivity(activityId);

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                isParticipant: false,
                participantCount: Math.max(
                  (activity.participantCount || 1) - 1,
                  0,
                ),
              }
            : activity,
        ),
      );
      // Update selected activity as well
      if (selectedActivity?.id === activityId) {
        setSelectedActivity((prev) =>
          prev
            ? {
                ...prev,
                isParticipant: false,
                participantCount: Math.max((prev.participantCount || 1) - 1, 0),
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to leave activity:", error);
      Alert.alert("Error", "Failed to leave activity. Please try again.");
    }
  };

  const handleAddComment = async (activityId: string, commentText: string) => {
    try {
      const newComment = await apiService.addComment(activityId, commentText);

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                comments: [...(activity.comments || []), newComment],
              }
            : activity,
        ),
      );
      // Update selected activity as well
      if (selectedActivity?.id === activityId) {
        setSelectedActivity((prev) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), newComment],
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: Activity }) => (
    <ActivityItem activity={item} onPress={handleActivityPress} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colorScheme === "dark" ? "#333" : "#f5f5f5",
            color: colors.text,
            borderColor: colors.tint,
          },
        ]}
        placeholder="Search activities..."
        placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading activities...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No activities found
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.text }]}>
          Try adjusting your search
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredActivities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={
          filteredActivities.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      />
      <ActivityDetailBottomSheet
        activity={selectedActivity}
        onClose={handleCloseBottomSheet}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onAddComment={handleAddComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});
