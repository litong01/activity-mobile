import { AppConfig } from "@/config/app.config";
import { Activity, Comment } from "@/types/Activity";
import { authService } from "./auth.service";

/**
 * API Service
 *
 * Centralized API client for all backend calls.
 * Automatically includes authentication headers.
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AppConfig.api.baseUrl;
  }

  /**
   * Generic fetch wrapper with authentication
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = authService.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      console.log(
        `[API] ${options.method || "GET"} ${this.baseUrl}${endpoint}`,
      );
      if (options.body) {
        console.log("[API] Request body:", options.body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      console.log(`[API] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error response:`, errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const responseData = await response.json();
      console.log(
        "[API] Response data:",
        JSON.stringify(responseData).substring(0, 200),
      );
      return responseData;
    } catch (error) {
      console.error(`[API] Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Activities API (paginated; matches GET /activities in OpenAPI).
   * Response: { data: Activity[], meta: PaginationMeta }.
   */
  async getActivities(filters?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
    startTimeFrom?: string;
    startTimeTo?: string;
    organizerId?: string;
    available?: boolean;
  }): Promise<Activity[]> {
    const params = new URLSearchParams();
    if (filters?.page != null)
      params.append("page", String(filters.page));
    if (filters?.limit != null)
      params.append("limit", String(filters.limit));
    if (filters?.type) params.append("type", filters.type);
    if (filters?.location) params.append("location", filters.location);
    if (filters?.startTimeFrom)
      params.append("startTimeFrom", filters.startTimeFrom);
    if (filters?.startTimeTo)
      params.append("startTimeTo", filters.startTimeTo);
    if (filters?.organizerId)
      params.append("organizerId", filters.organizerId);
    if (filters?.available !== undefined)
      params.append("available", String(filters.available));

    const query = params.toString();
    const endpoint = `/activities${query ? `?${query}` : ""}`;

    const response = await this.fetch<{ data?: Activity[]; meta?: unknown }>(
      endpoint,
    );
    return response.data ?? [];
  }

  async getActivity(id: string): Promise<Activity> {
    const response = await this.fetch<ApiResponse<Activity>>(
      `/activities/${id}`,
    );
    if (!response.data) {
      throw new Error("Activity not found");
    }
    return response.data;
  }

  /**
   * Get activities for the current user (organizer, participant, or requesting).
   * Uses GET /users/{id}/activities (paginated; matches OpenAPI). Returns [] if not authenticated.
   * Response: { data: Activity[], meta: PaginationMeta }.
   */
  async getMyActivities(filters?: {
    page?: number;
    limit?: number;
    startTimeFrom?: string;
    startTimeTo?: string;
  }): Promise<Activity[]> {
    const user = authService.getUser();
    if (!user?.id) return [];
    const params = new URLSearchParams();
    if (filters?.page != null)
      params.append("page", String(filters.page));
    if (filters?.limit != null)
      params.append("limit", String(filters.limit));
    if (filters?.startTimeFrom)
      params.append("startTimeFrom", filters.startTimeFrom);
    if (filters?.startTimeTo)
      params.append("startTimeTo", filters.startTimeTo);
    const query = params.toString();
    const endpoint = `/users/${user.id}/activities${query ? `?${query}` : ""}`;
    const response = await this.fetch<{ data?: Activity[]; meta?: unknown }>(
      endpoint,
    );
    return response.data ?? [];
  }

  async joinActivity(activityId: string): Promise<void> {
    await this.fetch<ApiResponse<void>>(`/activities/${activityId}/join`, {
      method: "POST",
    });
  }

  async leaveActivity(activityId: string): Promise<void> {
    await this.fetch<ApiResponse<void>>(`/activities/${activityId}/leave`, {
      method: "POST",
    });
  }

  async createActivity(data: {
    name: string;
    type: string;
    location?: string;
    startTime: string;
    endTime?: string;
    maxParticipants?: number;
    state?: string;
    organizerId: string;
    requiresApproval?: boolean;
  }): Promise<Activity> {
    const response = await this.fetch<Activity>(`/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  }

  /**
   * Comments API
   */
  async getComments(activityId: string): Promise<Comment[]> {
    const response = await this.fetch<ApiResponse<Comment[]>>(
      `/activities/${activityId}/comments`,
    );
    return response.data || [];
  }

  async addComment(activityId: string, text: string): Promise<Comment> {
    const response = await this.fetch<ApiResponse<Comment>>(
      `/activities/${activityId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
    );
    if (!response.data) {
      throw new Error("Failed to add comment");
    }
    return response.data;
  }

  async deleteComment(activityId: string, commentId: string): Promise<void> {
    await this.fetch<ApiResponse<void>>(
      `/activities/${activityId}/comments/${commentId}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * User API
   */
  async getCurrentUser() {
    const response = await this.fetch<ApiResponse<any>>("/user/me");
    return response.data;
  }

  async updateUserProfile(
    data: Partial<{
      name: string;
      email: string;
      picture: string;
    }>,
  ) {
    const response = await this.fetch<ApiResponse<any>>("/user/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
