# Running the app on iOS (simulator and device)

## Simulator vs iPad (physical device)

| Where you run the app | What “localhost” means | How to connect to Metro |
|------------------------|------------------------|---------------------------|
| **iOS Simulator**      | Your Mac (Metro runs there) | `localhost:8082` works. The app can use **exp://localhost:8082** automatically. |
| **iPad (physical)**    | The iPad itself        | `localhost` is wrong. Use your **Mac’s IP** and enter **exp://\<Mac-IP\>:8082** in the dev client (e.g. exp://192.168.1.5:8082). |

So:

- **Simulator:** Using localhost is correct; the app can connect to Metro on your Mac.
- **iPad:** The app must connect to your Mac over the network. Same WiFi, then use the Mac’s IP (e.g. from `ifconfig` or System Settings → Network) and port **8082**.

There is no single “correct” host in Xcode that works for both: simulator needs localhost, device needs your Mac’s IP. That’s why on iPad you enter the URL manually (or use QR from `npm start`).

---

## What is ios/.xcode.env? (Script vs Xcode)

The **Metro port** (and similar build-time options) are not set in Xcode’s Build Settings GUI. They come from the file **ios/.xcode.env**.

- Xcode’s build scripts **source** that file (see React Native’s `with-environment.sh`). So whatever you put in **ios/.xcode.env** is what Xcode uses.
- **patch-xcode-env.js** only writes that file (adds `export RCT_METRO_PORT=8082`). It does **the same thing** as opening the project in Xcode and editing **ios/.xcode.env** by hand.
- So: no separate “Xcode setting” to change for the Metro port; the script is just automating the edit of the file Xcode already reads. You can skip the script and edit **ios/.xcode.env** yourself after `expo prebuild` if you prefer.

---

## Port 8082 (why not 8081?)

We use **port 8082** so Metro doesn’t clash with other tools (8081 is the default and often in use). The app is configured to use 8082 via **ios/.xcode.env** (`RCT_METRO_PORT=8082`), either by the patch script or by editing that file after prebuild.

---

## How to run

### Recommended: avoid manual URL entry

To **never** have to type the URL in Expo Go or the dev client:

1. Run **`npm start`** (Metro on 8082).
2. When the Expo menu appears, press **`i`** to open the iOS simulator.

Expo passes the dev server URL when it opens the app, so the project loads automatically. Use this workflow for daily development instead of building from Xcode.

### If you build from Xcode and see the URL screen

1. **Metro must be running first:** In a terminal, run `npm start` and leave it running.
2. Build and run from Xcode (or run `npm run ios:run` in another terminal).
3. When the app opens and shows the URL / launcher screen, **don’t type the URL.** In another terminal run:
   ```bash
   npm run ios:url
   ```
   That sends **exp://localhost:8082** to the simulator so the app loads without typing.

4. **Next time:** The project uses **expo-dev-client** with **launchMode: "most-recent"**, so after you’ve connected once, the dev client should remember the URL and auto-connect on later launches.

### Simulator (other options)

1. Run `npm start` (Metro on 8082).
2. Press **`i`** to open the iOS simulator, or run `npm run ios` in another terminal.

The app will use **exp://localhost:8082** (or the port from .xcode.env).

### Choose which simulator from the command line

To launch on a **specific simulator** when you run `npm run ios` (instead of the default, e.g. iPad):

**Option 1 – Pass the device name**

```bash
npm run ios -- --device "iPhone 16"
```

Use the exact name as shown in Xcode (e.g. `iPhone 16`, `iPhone 15 Pro`, `iPad Pro (12.9-inch)`).

**Option 2 – Use the iPhone script**

```bash
npm run ios:iphone
```

This runs on **iPhone 16** by default. To use another iPhone, edit the `ios:iphone` script in **package.json** and change the device name.

### iPad (physical device)

1. Ensure iPad and Mac are on the **same Wi‑Fi**.
2. On Mac: run `npm start`. Note the URL shown (e.g. **exp://192.168.1.5:8082**).
3. Build and install the app on the iPad (e.g. `npm run ios -- --device` or run from Xcode and pick the iPad).
4. When the dev client opens and asks for a URL, enter **exp://\<your-mac-ip\>:8082** (same as in step 2).

---

## If you get “No script URL provided” (simulator)

1. Regenerate iOS and set the Metro port:
   ```bash
   npm run prebuild:clean
   ```
   (This runs `expo prebuild --clean` and then sets `RCT_METRO_PORT=8082` and `RCT_METRO_HOST=localhost` in **ios/.xcode.env**.)

2. Or do it manually: after `expo prebuild`, open **ios/.xcode.env** and add:
   ```bash
   export RCT_METRO_PORT=8082
   ```

3. Rebuild and run (e.g. `npm run ios`). Make sure Metro is already running (`npm start`) so the app can load the bundle.

**Recommended fix: start Metro first, then run the app without starting a second Metro**

The app must connect to Metro that is **already running**. If you run only `npm run ios` or `npm run ios:iphone`, Metro and the app start together and the app may get "No script URL provided". Use this instead:

1. **Terminal 1:** Run `npm start` and wait until you see "Metro waiting on...".
2. **Terminal 2:** Run `npm run ios:iphone:run` (for iPhone 17) or `npm run ios:run` (default simulator).

The `ios:run` and `ios:iphone:run` scripts use `--no-bundler`, so they only build and launch the app; they do not start a second Metro. The app connects to the Metro in Terminal 1 and gets the bundle URL from **ios/.xcode.env** (RCT_METRO_PORT=8082, RCT_METRO_HOST=localhost).

---

## White screen / no way to enter URL (simulator)

If the app shows a white screen and you don't see the "enter URL" screen:

**Method that works:** Go to the **simulator home screen** (e.g. **Cmd+Shift+H** or swipe up), then tap the **Expo** app icon. From the Expo app you can enter the dev server URL (e.g. **exp://localhost:8082**).

**Other options** (may not work in all setups):
- **Keyboard:** With simulator focused, try **Cmd+D** or **Cmd+Ctrl+Z** to open the dev menu, then look for "Change Bundle Location" or "Enter URL".
- **Simulator menu:** **Device → Shake** (or **Hardware → Shake Gesture**).
- **Terminal:** In the window where Metro is running (`npm start`), press **M** to open the dev menu on the connected simulator.

---

## Summary

| Topic | Answer |
|--------|--------|
| Simulator vs iPad | Simulator: localhost is correct. iPad: use **exp://\<Mac-IP\>:8082** in the dev client. |
| Script vs Xcode | **ios/.xcode.env** is what Xcode uses. The script only edits that file; you can edit it in Xcode instead. |
| Port | **8082** for this project (set in **ios/.xcode.env** as `RCT_METRO_PORT=8082`). |
