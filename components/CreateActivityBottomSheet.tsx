import { useColorScheme } from "@/components/useColorScheme";
import { AppConfig } from "@/config/app.config";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import {
  Activity,
  formatActivityTime,
  getActivityOrganizerName,
  getActivityUserRole,
  getParticipantCount
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
  activity: Activity | null | undefined; // undefined = closed, null = create mode, Activity = view/edit mode
  onClose: () => void;
  onCreate: (form: CreateActivityForm) => void;
  onJoin?: (activityId: string) => void;
  onLeave?: (activityId: string) => void;
  onAddComment?: (activityId: string, comment: string) => void;
  onEdit?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  onUpdate?: (activityId: string, form: CreateActivityForm) => void;
  /** When true and activity is set, open in edit mode (form pre-filled). */
  initialEditMode?: boolean;
}

export default function CreateActivityBottomSheet({
  activity,
  onClose,
  onCreate,
  onJoin,
  onLeave,
  onAddComment,
  onEdit,
  onDelete,
  onUpdate,
  initialEditMode = false,
}: CreateActivityBottomSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isProMode, setIsProMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Date/time validation
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState("");

  // ProMode fields
  const [activityType, setActivityType] = useState("social");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [duration, setDuration] = useState("1 hour");

  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const resetForm = useCallback(() => {
    setTitle("");
    setStartTime("");
    setLocation("");
    setRequiresApproval(false);
    setCommentText("");
  }, []);

  // Populate form when viewing/editing an activity; reset when closed or create mode
  useEffect(() => {
    if (activity) {
      setTitle(activity.name);
      setActivityType(activity.type);
      // Show When in local time (e.g. "Feb 15 at 5:00 AM"), not raw UTC ISO
      const start = new Date(activity.startTime);
      const dateStr = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const timeStr = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      setStartTime(`${dateStr} at ${timeStr}`);
      // Calculate duration from start and end time
      if (activity.endTime) {
        const start = new Date(activity.startTime);
        const end = new Date(activity.endTime);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 1) {
          setDuration(`${diffHours} hour${diffHours > 1 ? "s" : ""}`);
        } else {
          const diffMins = Math.round(diffMs / (1000 * 60));
          setDuration(`${diffMins} minute${diffMins > 1 ? "s" : ""}`);
        }
      }
      setLocation(activity.location || "");
      setMaxParticipants(activity.maxParticipants?.toString() || "10");
      setRequiresApproval(activity.requiresApproval || false);
    } else {
      setIsEditMode(false);
      resetForm();
    }
    if (activity && initialEditMode) {
      setIsEditMode(true);
      setIsProMode(false); // Edit opens in Easy mode; user can switch to Pro mode
    }
  }, [activity, resetForm, initialEditMode]);

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

  // Parse and validate date/time input
  const parseDateTime = useCallback(
    (input: string): { date: Date | null; error: string } => {
      if (!input.trim()) {
        return { date: null, error: "Please enter a date and time" };
      }

      const inputLower = input.trim().toLowerCase();
      let baseDate = new Date();

      // Handle "today" or "tomorrow"
      if (inputLower.includes("tomorrow")) {
        baseDate.setDate(baseDate.getDate() + 1);
      }

      // Handle weekday names: "Monday 7:00pm" → next occurrence of that day (or today if still in future)
      const weekdayMatch = inputLower.match(
        /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b/i,
      );
      if (weekdayMatch) {
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const targetDay = dayNames.indexOf(weekdayMatch[1].toLowerCase());
        const currentDay = baseDate.getDay();
        let daysToAdd = (targetDay - currentDay + 7) % 7;
        baseDate.setDate(baseDate.getDate() + daysToAdd);
      }

      // Handle month/day patterns like "feb 10", "2/10"
      const dateMatch = inputLower.match(
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)|(\d{1,2})\/(\d{1,2})/i,
      );
      if (dateMatch) {
        if (dateMatch[1]) {
          const day = parseInt(dateMatch[1]);
          const monthMap: { [key: string]: number } = {
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            may: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            oct: 9,
            nov: 10,
            dec: 11,
          };
          const monthStr = inputLower.match(
            /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i,
          )?.[0];
          if (monthStr) {
            baseDate.setMonth(monthMap[monthStr.toLowerCase()]);
            baseDate.setDate(day);
          }
        } else if (dateMatch[2] && dateMatch[3]) {
          baseDate.setMonth(parseInt(dateMatch[2]) - 1);
          baseDate.setDate(parseInt(dateMatch[3]));
        }
      }

      // Parse time (3pm, 10am, 5:00 pm, etc.). Prefer part after " at " so "Feb 15 at 5:00 pm" uses 5:00 pm not 15.
      const timePart = inputLower.includes(" at ")
        ? inputLower.split(" at ").pop()?.trim() ?? inputLower
        : inputLower;
      const timeMatch = timePart.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || "0");
        const isPM = timeMatch[3]?.toLowerCase() === "pm";

        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        baseDate.setHours(hours, minutes, 0, 0);
      } else if (
        inputLower !== "today" &&
        !inputLower.includes("tomorrow") &&
        !dateMatch &&
        !weekdayMatch
      ) {
        return {
          date: null,
          error: "Could not understand the date/time format",
        };
      }

      // Check if date is in the past
      const now = new Date();
      if (baseDate < now) {
        // If user said a weekday (e.g. "Monday 7pm"), use next week's occurrence
        if (weekdayMatch) {
          baseDate.setDate(baseDate.getDate() + 7);
          if (baseDate >= now) return { date: baseDate, error: "" };
        }
        return { date: null, error: "Date and time cannot be in the past" };
      }

      return { date: baseDate, error: "" };
    },
    [],
  );

  const handleDateTimeBlur = useCallback(() => {
    if (!startTime.trim()) {
      setParsedDate(null);
      setDateError("");
      return;
    }

    const result = parseDateTime(startTime);
    setParsedDate(result.date);
    setDateError(result.error);
  }, [startTime, parseDateTime]);

  const handleCreate = useCallback(() => {
    if (!title.trim()) return;

    // Deduce activity type from title
    const titleLower = title.toLowerCase();
    let deducedType = "social"; // default

    if (titleLower.includes("tennis")) deducedType = "tennis";
    else if (titleLower.includes("basketball")) deducedType = "basketball";
    else if (titleLower.includes("sport") || titleLower.includes("game"))
      deducedType = "sports";
    else if (
      titleLower.includes("music") ||
      titleLower.includes("concert") ||
      titleLower.includes("band")
    )
      deducedType = "music";
    else if (
      titleLower.includes("food") ||
      titleLower.includes("dinner") ||
      titleLower.includes("lunch") ||
      titleLower.includes("coffee")
    )
      deducedType = "food";
    else if (
      titleLower.includes("hike") ||
      titleLower.includes("outdoor") ||
      titleLower.includes("camping")
    )
      deducedType = "outdoor";
    else if (
      titleLower.includes("learn") ||
      titleLower.includes("study") ||
      titleLower.includes("class")
    )
      deducedType = "learning";

    // Parse the start time input with natural language support
    let startTimeISO: string;
    if (startTime.trim()) {
      const input = startTime.trim().toLowerCase();
      let baseDate = new Date();

      // Handle "today" or "tomorrow"
      if (input.includes("tomorrow")) {
        baseDate.setDate(baseDate.getDate() + 1);
      }
      // Handle weekday names (e.g. "Monday 7:00pm")
      const weekdayMatch = input.match(
        /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b/i,
      );
      if (weekdayMatch) {
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const targetDay = dayNames.indexOf(weekdayMatch[1].toLowerCase());
        const currentDay = baseDate.getDay();
        let daysToAdd = (targetDay - currentDay + 7) % 7;
        baseDate.setDate(baseDate.getDate() + daysToAdd);
      }
      // Handle month/day patterns like "feb 10", "2/10"
      const dateMatch = input.match(
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)|(\d{1,2})\/(\d{1,2})/i,
      );
      if (dateMatch) {
        if (dateMatch[1]) {
          // "feb 10" format
          const day = parseInt(dateMatch[1]);
          const monthMap: { [key: string]: number } = {
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            may: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            oct: 9,
            nov: 10,
            dec: 11,
          };
          const monthStr = input.match(
            /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i,
          )?.[0];
          if (monthStr) {
            baseDate.setMonth(monthMap[monthStr.toLowerCase()]);
            baseDate.setDate(day);
          }
        } else if (dateMatch[2] && dateMatch[3]) {
          // "2/10" format
          baseDate.setMonth(parseInt(dateMatch[2]) - 1);
          baseDate.setDate(parseInt(dateMatch[3]));
        }
      }

      // Parse time (3pm, 10am, 15:00, etc.). Prefer part after " at " when present.
      const timePart = input.includes(" at ")
        ? input.split(" at ").pop()?.trim() ?? input
        : input;
      const timeMatch = timePart.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || "0");
        const isPM = timeMatch[3]?.toLowerCase() === "pm";

        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        baseDate.setHours(hours, minutes, 0, 0);
      }

      // If weekday was used and result is still in the past, use next week
      const now = new Date();
      if (weekdayMatch && baseDate < now) {
        baseDate.setDate(baseDate.getDate() + 7);
      }

      startTimeISO = baseDate.toISOString();
    } else {
      startTimeISO = new Date().toISOString();
    }

    // Default to 1 hour duration
    let endTimeISO: string;
    if (isProMode && duration.trim()) {
      // Parse duration input in ProMode
      const input = duration.trim().toLowerCase();
      const startDate = new Date(startTimeISO);

      const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
      const minMatch = input.match(/(\d+)\s*(?:minute|min)/);

      if (hourMatch) {
        const hours = parseFloat(hourMatch[1]);
        startDate.setMinutes(startDate.getMinutes() + hours * 60);
        endTimeISO = startDate.toISOString();
      } else if (minMatch) {
        const minutes = parseInt(minMatch[1]);
        startDate.setMinutes(startDate.getMinutes() + minutes);
        endTimeISO = startDate.toISOString();
      } else {
        // Default to 1 hour if parse fails
        const endDate = new Date(startTimeISO);
        endDate.setHours(endDate.getHours() + 1);
        endTimeISO = endDate.toISOString();
      }
    } else {
      // EasyMode: default to 1 hour
      const endDate = new Date(startTimeISO);
      endDate.setHours(endDate.getHours() + 1);
      endTimeISO = endDate.toISOString();
    }

    // Use ProMode type if active, otherwise deduce from title
    const finalType = isProMode ? activityType : deducedType;
    const finalMaxParticipants =
      isProMode && maxParticipants.trim()
        ? parseInt(maxParticipants.trim())
        : 10;

    onCreate({
      name: title.trim(),
      type: finalType,
      startTime: startTimeISO,
      endTime: endTimeISO,
      location: location.trim() || undefined,
      maxParticipants: finalMaxParticipants,
      organizerId: authService.getUser()?.id ?? AppConfig.mockUser.id,
      requiresApproval: requiresApproval,
    });
    resetForm();
  }, [
    title,
    startTime,
    location,
    requiresApproval,
    isProMode,
    activityType,
    maxParticipants,
    duration,
    onCreate,
    resetForm,
  ]);

  const handleUpdate = useCallback(() => {
    if (
      !activity ||
      !onUpdate ||
      !title.trim() ||
      !startTime.trim() ||
      !location.trim()
    )
      return;
    // Parse current When input at submit time so we use the edited value, not stale parsedDate
    const parseResult = parseDateTime(startTime);
    if (parseResult.error || !parseResult.date) {
      setDateError(parseResult.error || "Please enter a valid date and time");
      return;
    }
    setDateError("");
    const startTimeISO = parseResult.date.toISOString();
    let endTimeISO: string;
    if (duration.trim()) {
      const startDate = new Date(startTimeISO);
      const input = duration.trim().toLowerCase();
      const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
      const minMatch = input.match(/(\d+)\s*(?:minute|min)/);
      if (hourMatch) {
        const hours = parseFloat(hourMatch[1]);
        startDate.setHours(
          startDate.getHours() + hours,
          startDate.getMinutes(),
          startDate.getSeconds(),
          startDate.getMilliseconds(),
        );
        endTimeISO = startDate.toISOString();
      } else if (minMatch) {
        startDate.setMinutes(
          startDate.getMinutes() + parseInt(minMatch[1], 10),
          startDate.getSeconds(),
          startDate.getMilliseconds(),
        );
        endTimeISO = startDate.toISOString();
      } else {
        const endDate = new Date(startTimeISO);
        endDate.setHours(endDate.getHours() + 1);
        endTimeISO = endDate.toISOString();
      }
    } else {
      const endDate = new Date(startTimeISO);
      endDate.setHours(endDate.getHours() + 1);
      endTimeISO = endDate.toISOString();
    }
    const finalMaxParticipants = maxParticipants.trim()
      ? parseInt(maxParticipants.trim(), 10)
      : 10;
    onUpdate(activity.id, {
      name: title.trim(),
      type: activityType,
      startTime: startTimeISO,
      endTime: endTimeISO,
      location: location.trim() || undefined,
      maxParticipants: finalMaxParticipants,
      organizerId: activity.organizerId,
      requiresApproval: requiresApproval,
    });
    setIsEditMode(false);
  }, [
    activity,
    onUpdate,
    title,
    startTime,
    location,
    duration,
    activityType,
    maxParticipants,
    requiresApproval,
    parseDateTime,
  ]);

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

  const handleEditPress = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleDeletePress = useCallback(() => {
    if (activity && onDelete) {
      onDelete(activity.id);
    }
  }, [activity, onDelete]);

  const handleAddComment = useCallback(() => {
    if (activity && onAddComment && commentText.trim()) {
      onAddComment(activity.id, commentText.trim());
      setCommentText("");
    }
  }, [activity, onAddComment, commentText]);

  const canSubmit =
    title.trim().length > 0 &&
    startTime.trim().length > 0 &&
    location.trim().length > 0 &&
    !dateError &&
    parsedDate !== null;
  const isCreateMode = activity === null;
  const showForm = isCreateMode || isEditMode;
  const userRole = activity ? getActivityUserRole(activity) : null;
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
            {isCreateMode
              ? "Create new activity"
              : isEditMode
                ? "Edit activity"
                : activity?.name}
          </Text>
          {(isCreateMode || isEditMode) && (
            <TouchableOpacity
              onPress={() => setIsProMode(!isProMode)}
              style={styles.modeToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.radioButton,
                  { borderColor: colors.tint },
                  isProMode && { backgroundColor: colors.tint },
                ]}
              >
                {isProMode && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={[styles.modeToggleText, { color: colors.text }]}>
                {isProMode ? "Pro Mode" : "Easy Mode"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <FontAwesome name="times" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {showForm ? (
          // CREATE OR EDIT MODE: Show form
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
                placeholder="e.g. Tennis Match, Basketball Game, Coffee Meetup"
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>When</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#333" : "#f5f5f5",
                    color: colors.text,
                    borderColor: dateError ? "#ff4444" : colors.tint,
                  },
                ]}
                placeholder="e.g. today 3pm, tomorrow 10am, Feb 10 2pm"
                placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
                value={startTime}
                onChangeText={setStartTime}
                onBlur={handleDateTimeBlur}
              />
              {dateError ? (
                <Text style={[styles.errorText, { color: "#ff4444" }]}>
                  {dateError}
                </Text>
              ) : parsedDate ? (
                <Text style={[styles.successText, { color: "#4CAF50" }]}>
                  ✓{" "}
                  {parsedDate.toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              ) : null}
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

            {isProMode && (
              <>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Type
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
                    placeholder="e.g. tennis, basketball, social"
                    placeholderTextColor={
                      colorScheme === "dark" ? "#999" : "#666"
                    }
                    value={activityType}
                    onChangeText={setActivityType}
                    autoCapitalize="none"
                  />
                  <Text style={[styles.helperText, { color: colors.text }]}>
                    Suggestions: sports, music, food, social, outdoor, learning,
                    tennis, basketball
                  </Text>
                </View>

                <View style={styles.section}>
                  <View style={styles.rowContainer}>
                    <View style={styles.halfWidth}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Max Participants
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
                        placeholder="e.g. 10"
                        placeholderTextColor={
                          colorScheme === "dark" ? "#999" : "#666"
                        }
                        value={maxParticipants}
                        onChangeText={setMaxParticipants}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Duration
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
                        placeholder="e.g. 1 hour"
                        placeholderTextColor={
                          colorScheme === "dark" ? "#999" : "#666"
                        }
                        value={duration}
                        onChangeText={setDuration}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Requires Approval
              </Text>
              <TouchableOpacity
                onPress={() => setRequiresApproval(!requiresApproval)}
                style={[
                  styles.switchContainer,
                  {
                    backgroundColor: requiresApproval
                      ? colors.tint
                      : colorScheme === "dark"
                        ? "#333"
                        : "#ccc",
                  },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    {
                      transform: [{ translateX: requiresApproval ? 22 : 2 }],
                    },
                  ]}
                />
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: colors.text }]}>
                {requiresApproval
                  ? `You'll approve each participant request${!isProMode ? " (max 10 people)" : ""}`
                  : `Anyone can join immediately${!isProMode ? " (max 10 people)" : ""}`}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: canSubmit ? colors.tint : "#ccc" },
              ]}
              onPress={isCreateMode ? handleCreate : handleUpdate}
              disabled={!canSubmit}
            >
              <FontAwesome
                name={isCreateMode ? "plus-circle" : "save"}
                size={18}
                color="#fff"
              />
              <Text style={styles.createButtonText}>
                {isCreateMode ? "Create activity" : "Save"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // VIEW MODE: Show activity details and role-based actions
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

            {userRole === "organizer" && onEdit && onDelete && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#666" }]}
                  onPress={handleEditPress}
                >
                  <FontAwesome name="pencil" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#ff6b6b" }]}
                  onPress={handleDeletePress}
                >
                  <FontAwesome name="trash" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            {userRole === "participant" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#ff6b6b" }]}
                onPress={handleLeave}
              >
                <FontAwesome name="sign-out" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Leave activity</Text>
              </TouchableOpacity>
            )}
            {userRole === "requester" && (
              <View
                style={[
                  styles.actionButton,
                  { backgroundColor: "#888", opacity: 0.9 },
                ]}
              >
                <FontAwesome name="clock-o" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Requested</Text>
              </View>
            )}
            {userRole === "watcher" && onJoin && (
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
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  thirdWidth: {
    flex: 0.35,
  },
  twoThirdsWidth: {
    flex: 0.65,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchContainer: {
    width: 50,
    height: 48,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  switch: {
    width: 50,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  successText: {
    fontSize: 12,
    marginTop: 6,
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
  actionRow: {
    flexDirection: "row",
    gap: 12,
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
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: "400",
    opacity: 0.6,
  },
});
