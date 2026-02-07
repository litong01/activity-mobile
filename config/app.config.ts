import { Platform } from "react-native";

/**
 * Application Configuration
 *
 * Toggle between development and production modes here.
 * In development mode:
 * - Authentication is bypassed with a mock user
 * - No need to login/logout repeatedly
 *
 * In production mode:
 * - Real Kinde authentication is used
 * - Users must login to access the app
 *
 * API base URL in dev:
 * - iOS simulator: localhost works (simulator runs on your Mac)
 * - Android emulator: use 10.0.2.2 (emulator's alias for host loopback)
 */

const getDevApiBaseUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8090"; // Android emulator → host machine
  }
  return "http://localhost:8090"; // iOS simulator / web
};

export const AppConfig = {
  // Set this to false when you want to use real authentication
  isDevelopmentMode: true,

  // Your backend API configuration
  api: {
    baseUrl: __DEV__
      ? getDevApiBaseUrl()
      : "https://your-production-api.com/api", // Your production backend
    timeout: 10000,
  },

  // Kinde configuration
  kinde: {
    issuerUrl: "https://your-domain.kinde.com",
    clientId: "your-kinde-client-id",
    redirectUri: "your-app-scheme://callback",
    logoutRedirectUri: "your-app-scheme://logout",
  },

  // Development mode mock user
  mockUser: {
    id: "user_alice_00000000000000001", // Alice Johnson
    email: "alice@example.com",
    name: "Alice Johnson",
    token: "mock-dev-token-12345",
  },
};
