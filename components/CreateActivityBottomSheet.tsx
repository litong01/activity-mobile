import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  Activity,
  formatActivityTime,
  getActivityOrganizerName,
  getParticipantCount,
  isUserParticipant,
} from "@/types/Activity";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ACTIVITY_TYPES = [
  "sports",
  "music",
  "food",
  "social",
  "outdoor",
  "learning",
  "tennis",
  "basketball",
];

export interface CreateActivityForm {
  name: string;
  type: string;
  location?: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  state?: "active" | "cancelled" | "completed";
  organizerId: string;
  requiresApproval?: boolean;
}

interface CreateActivityBottomSheetProps {
  activity: Activity | null | undefined; // undefined = closed, null = create mode, Activity = edit/view mode
  onClose: () => void;
  onCreate: (form: CreateActivityForm) => void;
  onJoin?: (activityId: string) => void;
  onLeave?: (activityId: string) => void;
  onAddComment?: (activityId: string, comment: string) => void;
}

export default function CreateActivityBottomSheet({
  activity,
  onClose,
  onCreate,
  onJoin,
  onLeave,
  onAddComment,
}: CreateActivityBottomSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("social");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [commentText, setCommentText] = useState("");

  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const resetForm = useCallback(() => {
    setTitle("");
    setActivityType("social");
    setTime("");
    setLocation("");
    setCommentText("");
  }, []);

  // Populate form when in edit mode
  useEffect(() => {
    if (activity) {
      setTitle(activity.name);
      setActivityType(activity.type);
      setTime(activity.startTime);
      setLocation(activity.location || "");
    } else {
      // Reset form for create mode
      resetForm();
    }
  }, [activity, resetForm]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleCreate = useCallback(() => {
    if (!title.trim()) return;
    onCreate({
      name: title.trim(),
      type: activityType,
      startTime: time.trim() || new Date().toISOString(),
      location: location.trim(),
      organizerId: "temp-user-id", // TODO: Replace with actual user ID from auth
      requiresApproval: false,
    });
    resetForm();
    onClose();
  }, [title, activityType, time, location, onCreate, resetForm, onClose]);

  const handleJoin = useCallback(() => {
    if (activity && onJoin) {
      onJoin(activity.id);
    }
  }, [activity, onJoin]);

  const handleLeave = useCallback(() => {
    if (activity && onLeave) {
      onLeave(activity.id);
    }
  }, [activity, onLeave]);

  const handleAddComment = useCallback(() => {
    if (activity && onAddComment && commentText.trim()) {
      onAddComment(activity.id, commentText.trim());
      setCommentText("");
    }
  }, [activity, onAddComment, commentText]);

  const canSubmit = title.trim().length > 0;
  const isCreateMode = activity === null;
  const sheetIndex = activity !== undefined ? 0 : -1; // Open if activity is set (null or object)

  return (
    <BottomSheet
      key={activity !== undefined ? "open" : "closed"}
      ref={bottomSheetRef}
      index={sheetIndex}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      animateOnMount={true}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.tint }}
    >
      <BottomSheetScrollView
        style={[
          styles.contentContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isCreateMode ? "Create new activity" : activity?.name}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <FontAwesome name="times" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {isCreateMode ? (
          // CREATE MODE: Show form
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#333" : "#f5f5f5",
                    color: colors.text,
                    borderColor: colors.tint,
                  },
                ]}
                placeholder="Activity title"
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <View style={styles.typeRow}>
                {ACTIVITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setActivityType(type)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          activityType === type
                            ? colors.tint
                            : colors.background,
                        borderColor: colors.tint,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: activityType === type ? "#fff" : colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Time</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#333" : "#f5f5f5",
                    color: colors.text,
                    borderColor: colors.tint,
                  },
                ]}
                placeholder="e.g. Today, 3:00 PM"
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
                value={time}
                onChangeText={setTime}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Location
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#333" : "#f5f5f5",
                    color: colors.text,
                    borderColor: colors.tint,
                  },
                ]}
                placeholder="Where is it?"
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: canSubmit ? colors.tint : "#ccc" },
              ]}
              onPress={handleCreate}
              disabled={!canSubmit}
            >
              <FontAwesome name="plus-circle" size={18} color="#fff" />
              <Text style={styles.createButtonText}>Create activity</Text>
            </TouchableOpacity>
          </>
        ) : (
          // VIEW/EDIT MODE: Show activity details
          <>
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <FontAwesome name="clock-o" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {activity ? formatActivityTime(activity) : ""}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="map-marker" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {activity?.location || "No location"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="user" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {activity ? getActivityOrganizerName(activity) : "Unknown"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="users" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {activity ? getParticipantCount(activity) : 0} /{" "}
                  {activity?.maxParticipants || "∞"} participants
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Type
              </Text>
              <View
                style={[
                  styles.typeChip,
                  {
                    borderColor: colors.tint,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Text style={[styles.typeChipText, { color: colors.tint }]}>
                  {activity?.type?.toUpperCase() || "ACTIVITY"}
                </Text>
              </View>
            </View>

            {activity && isUserParticipant(activity, undefined) ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#ff6b6b" }]}
                onPress={handleLeave}
              >
                <FontAwesome name="sign-out" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Leave activity</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={handleJoin}
              >
                <FontAwesome name="check" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Join activity</Text>
              </TouchableOpacity>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Messages
              </Text>
              {activity?.messages && activity.messages.length > 0 ? (
                activity.messages.map((message) => (
                  <View key={message.id} style={styles.comment}>
                    <Text
                      style={[styles.commentAuthor, { color: colors.text }]}
                    >
                      {message.user?.name || "Anonymous"}
                    </Text>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                      {message.content}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noComments, { color: colors.text }]}>
                  No messages yet
                </Text>
              )}

              <View style={styles.commentInputContainer}>
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
            </View>
          </>
        )}
      </BottomSheetScrollView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    zIndex: 10,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // View mode styles
  detailSection: {
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  comment: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
  },
  commentInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
