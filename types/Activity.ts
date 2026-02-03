export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  location: string;
  organizerId?: string;
  organizerName: string;
  activityType: "sports" | "music" | "food" | "social" | "outdoor" | "learning";
  imageUrl?: string;
  isParticipant?: boolean;
  participantCount?: number;
  maxParticipants?: number;
  comments?: Comment[];
}
