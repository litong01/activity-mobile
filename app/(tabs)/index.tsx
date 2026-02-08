import ActivityDetailBottomSheet from "@/components/ActivityDetailBottomSheet";
import ActivityItem from "@/components/ActivityItem";
import CreateActivityBottomSheet, {
  CreateActivityForm,
} from "@/components/CreateActivityBottomSheet";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useActivitySync } from "@/contexts/ActivitySyncContext";
import { apiService } from "@/services/api.service";
import { Activity, getActivityOrganizerName } from "@/types/Activity";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACTIVITY_PAGE_SIZE = 10;

export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  /** Activity open in edit mode (same CreateActivityBottomSheet as My Activity tab). undefined = edit sheet closed. */
  const [activityToEdit, setActivityToEdit] = useState<Activity | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMorePast, setLoadingMorePast] = useState(false);
  const [loadingMoreFuture, setLoadingMoreFuture] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const pastLoadTriggered = useRef(false);
  /** Prevent onEndReached/scroll from firing load-more until initial load is done (avoids past prepended on first paint). */
  const initialLoadDone = useRef(false);

  const {
    subscribeToActivityUpdates,
    notifyActivityUpdated,
    subscribeToActivityDeleted,
    notifyActivityDeleted,
  } = useActivitySync();

  // Sync cached list when an activity is updated on the other tab (no API call)
  useEffect(() => {
    return subscribeToActivityUpdates((activity) => {
      setActivities((prev) =>
        prev.some((a) => a.id === activity.id)
          ? prev.map((a) => (a.id === activity.id ? activity : a))
          : prev,
      );
      setSelectedActivity((prev) =>
        prev?.id === activity.id ? activity : prev,
      );
      setActivityToEdit((prev) =>
        prev?.id === activity.id ? activity : prev,
      );
    });
  }, [subscribeToActivityUpdates]);

  // Sync: remove activity from list when deleted on the other tab
  useEffect(() => {
    return subscribeToActivityDeleted((activityId) => {
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setSelectedActivity((prev) => (prev?.id === activityId ? null : prev));
      setActivityToEdit((prev) => (prev?.id === activityId ? undefined : prev));
    });
  }, [subscribeToActivityDeleted]);

  /**
   * Filter to activities that start at or after now (exclude past on initial/refresh).
   * Uses a single "now" captured when processing the response; supports startTime or start_time.
   */
  const filterFutureOnly = (data: Activity[]) => {
    const nowMs = Date.now();
    return data.filter((a) => {
      const raw = a.startTime ?? (a as { start_time?: string }).start_time;
      if (!raw) return false;
      const ms = new Date(raw).getTime();
      if (Number.isNaN(ms)) return false;
      return ms >= nowMs;
    });
  };

  /**
   * Load initial window: future activities from now (PAGE_SIZE), sorted ascending.
   * startTimeFrom is "now" in UTC so the backend returns only activities that start at or after the current moment.
   */
  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasMorePast(true);
      setHasMoreFuture(true);
      const nowIso = new Date().toISOString(); // current date and time in UTC (e.g. 2026-02-18T07:00:00.000Z)
      const data = await apiService.getActivities({
        startTimeFrom: nowIso,
        limit: ACTIVITY_PAGE_SIZE,
      });
      const futureOnly = filterFutureOnly(data);
      const sorted = [...futureOnly].sort(
        (a, b) =>
          (a.startTime ? new Date(a.startTime).getTime() : 0) -
          (b.startTime ? new Date(b.startTime).getTime() : 0),
      );
      setActivities(sorted);
    } catch (error) {
      console.error("Failed to load activities:", error);
      Alert.alert(
        "Error",
        "Failed to load activities. Please check your backend server is running.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
      pastLoadTriggered.current = false;
      initialLoadDone.current = true;
    }
  }, []);

  // Initial load only (no refetch on tab focus)
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  /**
   * Refresh: reset to initial window (future from now).
   */
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setHasMorePast(true);
      setHasMoreFuture(true);
      const nowIso = new Date().toISOString(); // current date and time in UTC
      const data = await apiService.getActivities({
        startTimeFrom: nowIso,
        limit: ACTIVITY_PAGE_SIZE,
      });
      const futureOnly = filterFutureOnly(data);
      const sorted = [...futureOnly].sort(
        (a, b) =>
          (a.startTime ? new Date(a.startTime).getTime() : 0) -
          (b.startTime ? new Date(b.startTime).getTime() : 0),
      );
      setActivities(sorted);
    } catch (error) {
      console.error("Failed to refresh activities:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Load more past activities (scroll up). Fetches PAGE_SIZE activities with startTime < first.
   */
  const loadMorePast = useCallback(async () => {
    if (!initialLoadDone.current) return;
    if (loadingMorePast || !hasMorePast || activities.length === 0) return;
    const firstStart = activities[0].startTime;
    if (!firstStart) return;
    setLoadingMorePast(true);
    try {
      // Explicit range: from long ago until (before) first visible activity.
      // Some backends require both startTimeFrom and startTimeTo to return past activities.
      const startTimeFrom = new Date(0).toISOString(); // epoch, or use e.g. 1 year ago
      const data = await apiService.getActivities({
        startTimeFrom,
        startTimeTo: firstStart,
        limit: ACTIVITY_PAGE_SIZE,
      });
      console.log(
        "[Load past] request startTimeTo=",
        firstStart,
        "received",
        data?.length ?? 0,
        "activities",
      );
      const existingIds = new Set(activities.map((a) => a.id));
      const past = data.filter(
        (a) =>
          a.startTime &&
          a.startTime < firstStart &&
          !existingIds.has(a.id),
      );
      const sorted = [...past].sort(
        (a, b) =>
          (a.startTime ? new Date(a.startTime).getTime() : 0) -
          (b.startTime ? new Date(b.startTime).getTime() : 0),
      );
      if (sorted.length < ACTIVITY_PAGE_SIZE) setHasMorePast(false);
      setActivities((prev) => [...sorted, ...prev]);
    } catch (error) {
      console.error("Failed to load past activities:", error);
    } finally {
      setLoadingMorePast(false);
      pastLoadTriggered.current = false;
    }
  }, [activities, hasMorePast, loadingMorePast]);

  /**
   * Load more future activities (scroll down). Fetches PAGE_SIZE activities after last.
   */
  const loadMoreFuture = useCallback(async () => {
    if (loadingMoreFuture || !hasMoreFuture || activities.length === 0) return;
    const last = activities[activities.length - 1];
    const lastStart = last.startTime;
    if (!lastStart) return;
    setLoadingMoreFuture(true);
    try {
      const data = await apiService.getActivities({
        startTimeFrom: lastStart,
        limit: ACTIVITY_PAGE_SIZE + 1,
      });
      const existingIds = new Set(activities.map((a) => a.id));
      const future = data
        .filter(
          (a) =>
            a.startTime &&
            (new Date(a.startTime).getTime() > new Date(lastStart).getTime() ||
              (a.startTime === lastStart && a.id !== last.id)) &&
            !existingIds.has(a.id),
        )
        .slice(0, ACTIVITY_PAGE_SIZE);
      const sorted = [...future].sort(
        (a, b) =>
          (a.startTime ? new Date(a.startTime).getTime() : 0) -
          (b.startTime ? new Date(b.startTime).getTime() : 0),
      );
      if (sorted.length < ACTIVITY_PAGE_SIZE) setHasMoreFuture(false);
      setActivities((prev) => [...prev, ...sorted]);
    } catch (error) {
      console.error("Failed to load future activities:", error);
    } finally {
      setLoadingMoreFuture(false);
      pastLoadTriggered.current = false;
    }
  }, [activities, hasMoreFuture, loadingMoreFuture]);

  // Drag up → scroll to top → load more future. Drag down → scroll to bottom → load more past.
  const lastScrollY = useRef(0);
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!initialLoadDone.current) return;
      const y = e.nativeEvent.contentOffset.y;
      const crossedIntoTop = lastScrollY.current >= 60 && y < 60;
      lastScrollY.current = y;
      if (
        crossedIntoTop &&
        hasMoreFuture &&
        !loadingMoreFuture &&
        !pastLoadTriggered.current
      ) {
        pastLoadTriggered.current = true;
        loadMoreFuture();
      }
    },
    [hasMoreFuture, loadMoreFuture, loadingMoreFuture],
  );

  // Filter by search only; keep full list (past + future). Sort by start time ascending.
  const filteredActivities = useMemo(() => {
    let list = activities;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query) ||
          activity.location?.toLowerCase().includes(query) ||
          getActivityOrganizerName(activity).toLowerCase().includes(query),
      );
    }
    return [...list].sort(
      (a, b) =>
        (a.startTime ? new Date(a.startTime).getTime() : 0) -
        (b.startTime ? new Date(b.startTime).getTime() : 0),
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

  const refreshSelectedActivity = async (activityId: string) => {
    try {
      const updated = await apiService.getActivity(activityId);
      setSelectedActivity((prev) => (prev?.id === activityId ? updated : prev));
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? updated : a)),
      );
    } catch {
      // Ignore; list will still reflect previous state
    }
  };

  const handleRequestToJoin = async (activityId: string) => {
    try {
      await apiService.requestToJoinActivity(activityId);
      await refreshSelectedActivity(activityId);
    } catch (error) {
      console.error("Failed to request to join:", error);
      Alert.alert("Error", "Failed to request to join. Please try again.");
    }
  };

  const handleCancelRequest = async (activityId: string) => {
    try {
      await apiService.cancelJoinRequest(activityId);
      await refreshSelectedActivity(activityId);
    } catch (error) {
      console.error("Failed to cancel request:", error);
      Alert.alert("Error", "Failed to cancel request. Please try again.");
    }
  };

  const handleDelete = async (activityId: string) => {
    try {
      await apiService.deleteActivity(activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setSelectedActivity(null);
      if (activityToEdit?.id === activityId) setActivityToEdit(undefined);
      notifyActivityDeleted(activityId);
    } catch (error) {
      console.error("Failed to delete activity:", error);
      Alert.alert("Error", "Failed to delete activity. Please try again.");
    }
  };

  const handleEdit = (activityId: string) => {
    const activity =
      selectedActivity?.id === activityId
        ? selectedActivity
        : activities.find((a) => a.id === activityId);
    setSelectedActivity(null);
    if (activity) setActivityToEdit(activity);
  };

  const handleUpdate = async (
    activityId: string,
    form: CreateActivityForm,
  ) => {
    try {
      const updated = await apiService.updateActivity(activityId, {
        name: form.name,
        type: form.type,
        startTime: form.startTime,
        endTime: form.endTime ?? null,
        location: form.location ?? null,
        maxParticipants: form.maxParticipants ?? null,
      });
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? updated : a)),
      );
      setSelectedActivity((prev) => (prev?.id === activityId ? updated : prev));
      setActivityToEdit(undefined);
      notifyActivityUpdated(updated);
    } catch (error) {
      console.error("Failed to update activity:", error);
      Alert.alert("Error", "Failed to update activity. Please try again.");
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
    <ActivityItem
      activity={item}
      onPress={handleActivityPress}
      showOrganizer={false}
    />
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

  const listFooter = useCallback(() => {
    if (!loadingMorePast && !hasMorePast) return null;
    return (
      <View style={styles.loadMoreFooter}>
        {loadingMorePast && (
          <ActivityIndicator size="small" color={colors.tint} />
        )}
      </View>
    );
  }, [loadingMorePast, hasMorePast, colors.tint]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredActivities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {loadingMoreFuture && (
              <View style={styles.loadMoreHeader}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            )}
            {renderHeader()}
          </View>
        }
        ListFooterComponent={listFooter}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={
          filteredActivities.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        onEndReached={loadMorePast}
        onEndReachedThreshold={0.3}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
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
        onRequestToJoin={handleRequestToJoin}
        onCancelRequest={handleCancelRequest}
        onAddComment={handleAddComment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {activityToEdit !== undefined && (
        <CreateActivityBottomSheet
          activity={activityToEdit}
          initialEditMode
          onClose={() => setActivityToEdit(undefined)}
          onCreate={() => {}}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onAddComment={handleAddComment}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
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
  loadMoreHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreFooter: {
    paddingVertical: 12,
    alignItems: "center",
  },
});
