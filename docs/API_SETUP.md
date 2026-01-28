# API Integration & Authentication Setup

## Development Mode

By default, the app is configured for **development mode** to make testing easier without repeatedly logging in/out.

### Current Configuration

Located in `config/app.config.ts`:

```typescript
isDevelopmentMode: true; // Set to false for production
```

### Development Mode Features

✅ **Auto-authenticated** - No login required  
✅ **Mock user** - Automatically logged in as "Dev User"  
✅ **Mock token** - Pre-configured authentication token  
✅ **API fallback** - Falls back to mock data if backend is unavailable

### Backend API Configuration

Update your backend API URL in `config/app.config.ts`:

```typescript
api: {
  baseUrl: __DEV__
    ? 'http://localhost:3000/api' // Your local backend URL
    : 'https://your-production-api.com/api',
}
```

### Expected API Endpoints

The app expects your backend to provide these endpoints:

#### Activities

- `GET /activities` - List all activities
  - Optional query params: `search`, `type`, `limit`, `offset`
- `GET /activities/:id` - Get single activity
- `POST /activities/:id/join` - Join an activity
- `POST /activities/:id/leave` - Leave an activity

#### Comments

- `GET /activities/:id/comments` - Get comments for activity
- `POST /activities/:id/comments` - Add a comment
  - Body: `{ "text": "comment text" }`
- `DELETE /activities/:id/comments/:commentId` - Delete a comment

#### User

- `GET /user/me` - Get current user profile
- `PATCH /user/me` - Update user profile

### API Response Format

All endpoints should return responses in this format:

```typescript
{
  "success": true,
  "data": { /* your data here */ },
  "message": "Optional message"
}
```

For errors:

```typescript
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly error message"
}
```

## Switching to Production Mode

When ready to use real Kinde authentication:

1. Update `config/app.config.ts`:

   ```typescript
   isDevelopmentMode: false;
   ```

2. Configure your Kinde credentials:

   ```typescript
   kinde: {
     issuerUrl: 'https://your-domain.kinde.com',
     clientId: 'your-kinde-client-id',
     redirectUri: 'your-app-scheme://callback',
     logoutRedirectUri: 'your-app-scheme://logout',
   }
   ```

3. Implement Kinde authentication in `services/auth.service.ts` (marked with TODO comments)

## Testing API Integration

1. **Start your backend server** (make sure it's running on the configured URL)

2. **Open the app** - It will try to fetch activities from your API

3. **If API fails** - The app will show an alert and fall back to mock data

4. **Pull to refresh** - Swipe down to reload activities from the API

5. **Check console logs** - Development mode logs all API calls and authentication status

## Features Implemented

✅ Automatic API calls with authentication headers  
✅ Loading states and indicators  
✅ Pull-to-refresh functionality  
✅ Error handling with user alerts  
✅ Optimistic UI updates  
✅ Fallback to mock data when API unavailable  
✅ Development mode with auto-authentication

## Next Steps

1. Set up your backend API with the expected endpoints
2. Update the `baseUrl` in `config/app.config.ts`
3. Test the integration with your backend
4. When ready for production, configure Kinde and disable development mode
