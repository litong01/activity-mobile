# Deployment Guide for Activity Mobile App

This guide covers how to build and deploy your Expo app to the Apple App Store and Google Play Store.

## Prerequisites

### Required Accounts
1. **Apple Developer Account** - $99/year
   - Sign up at: https://developer.apple.com
   - Required for App Store distribution

2. **Google Play Developer Account** - $25 one-time fee
   - Sign up at: https://play.google.com/console
   - Required for Play Store distribution

3. **Expo Account** - Free
   - Sign up at: https://expo.dev
   - Required for EAS (Expo Application Services)

## Step 1: Install EAS CLI

Install the Expo Application Services CLI globally:

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

Login with your Expo account:

```bash
eas login
```

Enter your Expo credentials when prompted.

## Step 3: Configure EAS Build

Initialize EAS configuration (this creates `eas.json`):

```bash
eas build:configure
```

This will create an `eas.json` file with default build profiles.

## Step 4: Update App Configuration

Your `app.json` is already configured with:
- **iOS Bundle Identifier**: Update to your actual bundle ID
- **Android Package Name**: Update to your actual package name

Make sure to update these in `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.activitymobile"
    },
    "android": {
      "package": "com.yourcompany.activitymobile"
    }
  }
}
```

## Step 5: Build Your App

### Build for iOS (App Store)
```bash
eas build --platform ios --profile production
```

### Build for Android (Play Store)
```bash
eas build --platform android --profile production
```

### Build for Both Platforms
```bash
eas build --platform all --profile production
```

**Note:** First build takes 15-30 minutes. Subsequent builds are faster.

## Step 6: Download Build Artifacts

After the build completes:
- **iOS**: Downloads `.ipa` file
- **Android**: Downloads `.aab` (Android App Bundle) file

You can also download from the Expo dashboard: https://expo.dev

## Step 7: Submit to App Stores

### Submit to Apple App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple ID credentials
- App-specific password (or App Store Connect API key)
- App Store Connect app created (https://appstoreconnect.apple.com)

### Submit to Google Play Store

```bash
eas submit --platform android
```

You'll need:
- Google Service Account JSON key
- App created in Google Play Console

## iOS App Store Setup

### Before First Submission:

1. **Create App in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Click "+" to create new app
   - Fill in app name, bundle ID, etc.

2. **Prepare App Information**
   - App description
   - Keywords
   - Screenshots (required sizes)
   - Privacy policy URL (if collecting data)
   - Support URL

3. **App Review Information**
   - Contact information
   - Demo account (if login required)
   - Notes for reviewer

### Review Process:
- Takes 1-3 days typically
- Check status in App Store Connect
- Respond to any rejection feedback

## Google Play Store Setup

### Before First Submission:

1. **Create App in Play Console**
   - Go to https://play.google.com/console
   - Create new app
   - Fill in basic details

2. **Complete Store Listing**
   - App description
   - Screenshots (required sizes)
   - Feature graphic
   - App icon
   - Privacy policy URL

3. **Set Up Pricing & Distribution**
   - Free or paid
   - Countries to distribute
   - Content rating questionnaire

4. **Create Service Account** (for automated submission)
   - Required for `eas submit` command
   - Follow EAS prompts to create

### Review Process:
- Usually approved within hours
- Can take up to a few days
- Check status in Play Console

## Build Profiles (eas.json)

Common build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Testing Builds

### Internal Testing (Before Store Release)

**iOS - TestFlight:**
```bash
eas build --platform ios --profile preview
eas submit --platform ios
```
- Invite testers via App Store Connect
- No review required for internal testing

**Android - Internal Testing:**
```bash
eas build --platform android --profile preview
```
- Upload to Play Console internal testing track
- Share with test users

## Version Updates

When releasing updates:

1. Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

2. Rebuild and resubmit:
```bash
eas build --platform all --profile production
eas submit --platform all
```

## Over-the-Air (OTA) Updates

For minor JavaScript/asset updates without rebuilding:

```bash
eas update --branch production --message "Fixed minor bugs"
```

**Note:** Only works for JS code changes, not native code changes.

## Troubleshooting

### Build Fails
- Check error logs in EAS dashboard
- Ensure all dependencies are compatible
- Verify app.json configuration

### Submission Fails
- Verify credentials are correct
- Check bundle ID matches App Store Connect/Play Console
- Ensure all required metadata is filled

### App Rejected
- Read rejection reason carefully
- Fix issues and resubmit
- Common issues: missing privacy policy, unclear permissions

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel running build
eas build:cancel

# Check submission status
eas submit:list

# Create development build
eas build --profile development --platform ios
```

## Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Guidelines**: https://play.google.com/about/developer-content-policy/
- **Expo Forums**: https://forums.expo.dev/

## Cost Summary

- **Apple Developer Program**: $99/year
- **Google Play Developer**: $25 one-time
- **EAS Build**: Free tier available (limited builds/month)
  - Paid plans for more builds: https://expo.dev/pricing

---

**Ready to deploy?** Start with Step 1 and work through each step. Good luck! 🚀
