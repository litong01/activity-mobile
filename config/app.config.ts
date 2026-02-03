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
 */

export const AppConfig = {
  // Set this to false when you want to use real authentication
  isDevelopmentMode: true,

  // Your backend API configuration
  api: {
    baseUrl: __DEV__
      ? "http://localhost:8090" // Your local backend
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
    id: "dev-user-123",
    email: "dev@example.com",
    name: "Dev User",
    token: "mock-dev-token-12345",
  },
};
