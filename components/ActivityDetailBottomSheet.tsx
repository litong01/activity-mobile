import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Activity } from "@/types/Activity";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useMemo, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ActivityDetailBottomSheetProps {
  activity: Activity | null;
  onClose: () => void;
  onJoin: (activityId: string) => void;
  onLeave: (activityId: string) => void;
  onAddComment: (activityId: string, comment: string) => void;
}

export default function ActivityDetailBottomSheet({
  activity,
  onClose,
  onJoin,
  onLeave,
  onAddComment,
}: ActivityDetailBottomSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [commentText, setCommentText] = useState("");

  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const handleSheetChanges = (index: number) => {
    if (index === -1) {
      onClose();
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

  const handleAddComment = () => {
    if (commentText.trim() && activity) {
      onAddComment(activity.id, commentText.trim());
      setCommentText("");
    }
  };

  const handleJoin = () => {
    if (activity) {
      onJoin(activity.id);
    }
  };

  const handleLeave = () => {
    if (activity) {
      onLeave(activity.id);
    }
  };

  React.useEffect(() => {
    if (activity) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [activity]);

  const participantText = activity?.maxParticipants
    ? `${activity.participantCount || 0}/${activity.maxParticipants} participants`
    : `${activity?.participantCount || 0} participants`;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.tint }}
    >
      {activity && (
        <BottomSheetScrollView
          style={[
            styles.contentContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {activity.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Activity Type Badge */}
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={styles.badgeText}>
              {activity.activityType?.toUpperCase() || "ACTIVITY"}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.description, { color: colors.text }]}>
              {activity.description}
            </Text>
          </View>

          {/* Info Grid */}
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <FontAwesome name="clock-o" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {activity.time}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="map-marker" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {activity.location}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="user" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Organized by {activity.organizerName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="users" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {participantText}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            {activity.isParticipant ? (
              <TouchableOpacity
                style={[styles.button, styles.leaveButton]}
                onPress={handleLeave}
              >
                <FontAwesome name="sign-out" size={18} color="#fff" />
                <Text style={styles.buttonText}>Leave Activity</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleJoin}
              >
                <FontAwesome name="plus-circle" size={18} color="#fff" />
                <Text style={styles.buttonText}>Request to Join</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Discussion ({activity.comments?.length || 0})
            </Text>

            {/* Add Comment (only if participant) */}
            {activity.isParticipant && (
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#333" : "#f5f5f5",
                      color: colors.text,
                      borderColor: colors.tint,
                    },
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={
                    colorScheme === "dark" ? "#999" : "#666"
                  }
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: commentText.trim()
                        ? colors.tint
                        : "#ccc",
                    },
                  ]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <FontAwesome name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Comments List */}
            {activity.comments && activity.comments.length > 0 ? (
              <View style={styles.commentsList}>
                {activity.comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={[
                      styles.commentItem,
                      {
                        borderLeftColor: colors.tint,
                        backgroundColor:
                          colorScheme === "dark" ? "#222" : "#fafafa",
                      },
                    ]}
                  >
                    <View style={styles.commentHeader}>
                      <Text
                        style={[styles.commentAuthor, { color: colors.tint }]}
                      >
                        {comment.userName}
                      </Text>
                      <Text
                        style={[styles.commentTime, { color: colors.text }]}
                      >
                        {comment.timestamp}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                      {comment.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noComments, { color: colors.text }]}>
                {activity.isParticipant
                  ? "No comments yet. Be the first to comment!"
                  : "Join the activity to see and add comments."}
              </Text>
            )}
          </View>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  leaveButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: 20,
  },
});
