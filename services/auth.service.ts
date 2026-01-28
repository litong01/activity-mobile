import { AppConfig } from "@/config/app.config";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Authentication Service
 *
 * Provides authentication functionality with two modes:
 * 1. Development Mode: Returns mock user automatically
 * 2. Production Mode: Uses Kinde SDK for real authentication
 */
class AuthService {
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize authentication
   * In dev mode: auto-login with mock user
   * In prod mode: check for existing session
   */
  async initialize() {
    if (AppConfig.isDevelopmentMode) {
      // Development mode: auto-login with mock user
      this.authState = {
        user: {
          id: AppConfig.mockUser.id,
          email: AppConfig.mockUser.email,
          name: AppConfig.mockUser.name,
        },
        token: AppConfig.mockUser.token,
        isAuthenticated: true,
        isLoading: false,
      };
      this.notifyListeners();
      console.log(
        "🔧 DEV MODE: Auto-authenticated as",
        AppConfig.mockUser.name,
      );
    } else {
      // Production mode: check for existing Kinde session
      // TODO: Implement Kinde session check
      this.authState.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Login with Kinde (Production mode only)
   */
  async login() {
    if (AppConfig.isDevelopmentMode) {
      console.log("🔧 DEV MODE: Already authenticated, login not needed");
      return;
    }

    try {
      // TODO: Implement Kinde login
      // const result = await kindeClient.login();
      // this.authState = {
      //   user: result.user,
      //   token: result.token,
      //   isAuthenticated: true,
      //   isLoading: false,
      // };
      // this.notifyListeners();
      console.log("Production login not yet implemented");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  /**
   * Logout (Production mode only)
   */
  async logout() {
    if (AppConfig.isDevelopmentMode) {
      console.log("🔧 DEV MODE: Logout disabled in development mode");
      return;
    }

    try {
      // TODO: Implement Kinde logout
      // await kindeClient.logout();
      this.authState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
      this.notifyListeners();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.authState.user;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.authState.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

// Export singleton instance
export const authService = new AuthService();
