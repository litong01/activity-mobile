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
  ruleId?: string | null;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: Participant[];
  messages?: ActivityMessage[];
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
  const organizer = activity.participants?.find((p) => p.role === "organizer");
  return organizer?.user?.name || "Unknown";
}

export function isUserParticipant(
  activity: Activity,
  userId?: string,
): boolean {
  if (!userId) return false;
  return activity.participants?.some((p) => p.userId === userId) || false;
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
