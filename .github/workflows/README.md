# GitHub Actions Build Workflows

This directory contains GitHub Actions workflows for building your app.

## Android Build (Native - No EAS)

The Android workflow builds natively using Gradle and uploads artifacts to GitHub Releases.

### Setup Required Secrets (For Release Builds)

1. **ANDROID_KEYSTORE_BASE64**
   - Generate a keystore if you don't have one (using Docker):
     ```bash
     docker run --rm -v "$PWD":/work -w /work openjdk:27-ea-slim \
       keytool -genkey -v -keystore release.keystore -alias myactivity \
       -keyalg RSA -keysize 2048 -validity 10000 \
       -storepass myactivity -keypass myactivity \
       -dname "CN=mobile, OU=activity, O=taolio, L=Cary, ST=NC, C=US"
     ```
   - Convert to base64:
     ```bash
     base64 -i release.keystore | pbcopy  # macOS
     # or
     base64 -w 0 release.keystore  # Linux
     ```
   - Add to GitHub Secrets

2. **ANDROID_KEYSTORE_PASSWORD** - Keystore password
3. **ANDROID_KEY_ALIAS** - Key alias name
4. **ANDROID_KEY_PASSWORD** - Key password

### Optional: For Play Store Submission

5. **GOOGLE_SERVICE_ACCOUNT_JSON**
   - Create a service account in Google Play Console
   - Download JSON key
   - Add entire JSON content as secret

### Configure Gradle for Signing

You need to update `android/app/build.gradle` to use the keystore:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (System.getenv('KEYSTORE_FILE')) {
                storeFile file(System.getenv('KEYSTORE_FILE'))
                storePassword System.getenv('KEYSTORE_PASSWORD')
                keyAlias System.getenv('KEY_ALIAS')
                keyPassword System.getenv('KEY_PASSWORD')
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### How to Use Android Build

1. Go to Actions → "Build Android" → "Run workflow"
2. Choose options:
   - **Build type**: `release` or `debug`
   - **Submit to Play Store**: Check if ready to publish
   - **Create GitHub Release**: Check to attach APK/AAB to release
3. Click "Run workflow"

### Output

- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- Both attached to GitHub Release (if enabled)

---

## iOS Build (EAS)

The iOS workflow uses EAS (Expo Application Services) because iOS builds require macOS and Xcode.

### Setup Required Secrets

1. **EXPO_TOKEN**
   - Create at: https://expo.dev/accounts/[account]/settings/access-tokens
   - Add to GitHub Secrets

### Optional: For App Store Submission

2. **EXPO_APPLE_ID** - Your Apple ID email
3. **EXPO_APPLE_APP_SPECIFIC_PASSWORD**
   - Generate at: https://appleid.apple.com/account/manage
   - App-Specific Passwords section

### How to Use iOS Build

1. Go to Actions → "Build iOS" → "Run workflow"
2. Choose options:
   - **Submit to App Store**: Check if ready to publish
   - **Build profile**: production, preview, or development
3. Click "Run workflow"

### Output

- Build runs on EAS servers
- Monitor at: https://expo.dev
- Download IPA from Expo dashboard

---

## Cost Comparison

### Android (Native Build)

- ✅ **FREE** - Runs on GitHub's free runners
- ✅ No external services needed
- ✅ Full control over build

### iOS (EAS Build)

- 💰 **Requires EAS account**
- Free tier: Limited builds/month
- Paid plans: https://expo.dev/pricing
- Alternative: Use macOS runner (GitHub paid feature)

---

## Workflow Triggers

All workflows use `workflow_dispatch` - manual trigger only:

1. Go to repository → Actions tab
2. Select workflow
3. Click "Run workflow"
4. Fill in options
5. Click green "Run workflow" button

---

## Troubleshooting

### Android Build Fails

**"Keystore not found"**

- Verify `ANDROID_KEYSTORE_BASE64` is set correctly
- Ensure base64 encoding is valid

**"Gradle build failed"**

- Check `android/app/build.gradle` signing configuration
- Verify all keystore secrets are set

**"Package name mismatch"**

- Update package name in workflow to match `android/app/build.gradle`

### iOS Build Fails

**"EXPO_TOKEN invalid"**

- Regenerate token at expo.dev
- Update GitHub secret

**"Build failed on EAS"**

- Check logs at expo.dev dashboard
- Verify `app.json` iOS configuration

---

## Next Steps

1. ✅ Set up required secrets in GitHub
2. ✅ Configure Android signing in `build.gradle`
3. ✅ Run test build with debug/preview modes
4. ✅ Verify artifacts are generated
5. 🚀 Build release when ready!
