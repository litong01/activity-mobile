import { authService } from "@/services/auth.service";

export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  provider: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  activityId: string;
  userId: string;
  role: "participant" | "organizer" | null;
  joinedAt: string;
  user?: User;
}

export interface ActivityMessage {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "SYSTEM";
  createdAt: string;
  editedAt?: string | null;
  user?: {
    id: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  startTime: string;
  endTime?: string | null;
  maxParticipants?: number | null;
  state: "active" | "cancelled" | "completed";
  organizerId: string;
  /** Set by API when organizer details are included (e.g. expanded response) */
  organizerName?: string | null;
  ruleId?: string | null;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: Participant[];
  messages?: ActivityMessage[];
  /** Set by API for "my activities" responses: organizer | participant | requesting */
  myParticipationStatus?: "organizer" | "participant" | "requesting" | null;
}

// Legacy Comment type - can be removed once messages are fully implemented
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

// Helper functions for Activity
export function getActivityOrganizerName(activity: Activity): string {
  // 1) API may return organizerName directly
  if (activity.organizerName?.trim()) {
    return activity.organizerName.trim();
  }
  // 2) Organizer may be in participants with user populated
  const organizerParticipant = activity.participants?.find(
    (p) => p.role === "organizer",
  );
  if (organizerParticipant?.user?.name?.trim()) {
    return organizerParticipant.user.name.trim();
  }
  // 3) Current user is the organizer (e.g. activity they just created)
  const currentUser = authService.getUser();
  if (currentUser?.id === activity.organizerId && currentUser?.name?.trim()) {
    return currentUser.name.trim();
  }
  return "Unknown";
}

export function isUserParticipant(
  activity: Activity,
  userId?: string,
): boolean {
  if (!userId) return false;
  return activity.participants?.some((p) => p.userId === userId) || false;
}

/** Current user's relationship to this activity. "requesting" only when API sets myParticipationStatus. */
export function getMyParticipationStatus(
  activity: Activity,
): "organizer" | "participant" | "requesting" | null {
  if (activity.myParticipationStatus) {
    return activity.myParticipationStatus;
  }
  const currentUser = authService.getUser();
  if (!currentUser?.id) return null;
  if (activity.organizerId === currentUser.id) return "organizer";
  if (isUserParticipant(activity, currentUser.id)) return "participant";
  return null;
}

export function getParticipantCount(activity: Activity): number {
  return activity.participants?.length || 0;
}

export function formatActivityTime(activity: Activity): string {
  const start = new Date(activity.startTime);
  const now = new Date();
  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow =
    start.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;

  return start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
