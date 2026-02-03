import { Redirect } from "expo-router";
import React from "react";

// This screen is a placeholder; the center FAB navigates to modal/create flow.
// Redirect if someone lands here directly (e.g. deep link).
export default function CreateTabScreen() {
  return <Redirect href="/(tabs)" />;
}
