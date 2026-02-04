import ActivityItem from "@/components/ActivityItem";
import CreateActivityBottomSheet, {
  CreateActivityForm,
} from "@/components/CreateActivityBottomSheet";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { apiService } from "@/services/api.service";
import { Activity, getActivityOrganizerName } from "@/types/Activity";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { openCreate } = useLocalSearchParams<{ openCreate?: string }>();
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<
    Activity | null | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, []);

  // When plus button navigates here with ?openCreate=1, open the create bottom sheet
  useEffect(() => {
    if (openCreate === "1") {
      setSelectedActivity(null); // null = create mode
      // Clear the param so it doesn't reopen on revisit
      router.setParams({ openCreate: undefined });
    }
  }, [openCreate, router]);

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

  // Filter to only show user's activities (owned or participating)
  const myActivities = useMemo(() => {
    // TODO: Replace with actual user ID from auth context
    // For now, showing all activities until we have proper authentication
    // Once auth is implemented, uncomment this:
    // const currentUserId = authContext.user?.id;
    // return activities.filter(
    //   (activity) => activity.isParticipant || activity.organizerId === currentUserId
    // );
    return activities;
  }, [activities]);

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) {
      return myActivities;
    }

    const query = searchQuery.toLowerCase();
    return myActivities.filter(
      (activity) =>
        activity.name.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query) ||
        activity.location?.toLowerCase().includes(query) ||
        getActivityOrganizerName(activity).toLowerCase().includes(query),
    );
  }, [searchQuery, myActivities]);

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedActivity(undefined);
  }, []);

  const renderItem = ({ item }: { item: Activity }) => (
    <ActivityItem activity={item} onPress={() => handleActivityPress(item)} />
  );

  const handleCreateActivity = useCallback(
    async (form: CreateActivityForm) => {
      try {
        const newActivity = await apiService.createActivity(form);
        setSelectedActivity(undefined); // Close the bottom sheet
        await loadActivities(); // Refresh the list
        Alert.alert("Success", `Activity "${newActivity.name}" created!`);
      } catch (error) {
        console.error("Failed to create activity:", error);
        Alert.alert("Error", "Failed to create activity. Please try again.");
      }
    },
    [loadActivities],
  );

  const handleJoin = async (activityId: string) => {
    try {
      await apiService.joinActivity(activityId);
      await loadActivities(); // Refresh the list to get updated participants
    } catch (error) {
      console.error("Failed to join activity:", error);
      Alert.alert("Error", "Failed to join activity. Please try again.");
    }
  };

  const handleLeave = async (activityId: string) => {
    try {
      await apiService.leaveActivity(activityId);
      await loadActivities(); // Refresh the list to get updated participants
    } catch (error) {
      console.error("Failed to leave activity:", error);
      Alert.alert("Error", "Failed to leave activity. Please try again.");
    }
  };

  const handleAddComment = async (activityId: string, comment: string) => {
    try {
      await apiService.addComment(activityId, comment);
      await loadActivities(); // Refresh to get new message
    } catch (error) {
      console.error("Failed to add comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    }
  };

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
        placeholder="Search my activities..."
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
          {searchQuery
            ? "Try adjusting your search"
            : "Join some activities or create your own!"}
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
      <CreateActivityBottomSheet
        activity={selectedActivity}
        onClose={handleCloseBottomSheet}
        onCreate={handleCreateActivity}
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
