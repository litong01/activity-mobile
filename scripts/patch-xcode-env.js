/**
 * After expo prebuild, Xcode reads ios/.xcode.env when building. We set
 * RCT_METRO_PORT=8082 and RCT_METRO_HOST=localhost so the app constructs
 * the bundle URL (localhost:8082) at launch and doesn't show "No script URL provided".
 *
 * Simulator: localhost is correct (Metro runs on your Mac).
 * Physical device: you still need to enter exp://<your-mac-ip>:8082 in the
 * Expo app (localhost on device is the device itself). See docs/DEV_IOS.md.
 */
const fs = require("fs");
const path = require("path");

const iosDir = path.join(__dirname, "..", "ios");
const xcodeEnvPath = path.join(iosDir, ".xcode.env");

const linesToAdd = [
  "export RCT_METRO_PORT=8082",
  "export RCT_METRO_HOST=localhost",
];

if (!fs.existsSync(iosDir)) {
  console.log("scripts/patch-xcode-env.js: ios/ not found, skipping (run after expo prebuild)");
  process.exit(0);
}

let content = "";
if (fs.existsSync(xcodeEnvPath)) {
  content = fs.readFileSync(xcodeEnvPath, "utf8");
  content = content
    .replace(/export RCT_METRO_PORT=\d+\n?/g, "")
    .replace(/export RCT_METRO_HOST=.*\n?/g, "");
}
content += linesToAdd.map((l) => l + "\n").join("");
fs.writeFileSync(xcodeEnvPath, content, "utf8");
console.log("scripts/patch-xcode-env.js: set RCT_METRO_PORT=8082 and RCT_METRO_HOST=localhost in ios/.xcode.env");
