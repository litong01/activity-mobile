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
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Activities API
   */
  async getActivities(filters?: {
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Activity[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString();
    const endpoint = `/activities${query ? `?${query}` : ""}`;

    const response = await this.fetch<ApiResponse<Activity[]>>(endpoint);
    return response.data || [];
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
    title: string;
    description: string;
    activityType: string;
    time: string;
    location: string;
  }): Promise<Activity> {
    const response = await this.fetch<ApiResponse<Activity>>(`/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error("Failed to create activity");
    }
    return response.data;
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
