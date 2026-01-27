import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";

export default function TabThreeScreen() {
  const player = useVideoPlayer(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    (player) => {
      player.loop = true;
    },
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Three - Video Test</Text>
      <Text style={styles.subtitle}>Test audio in silent mode</Text>

      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />
      </View>

      <Text style={styles.instructions}>
        Put your device in silent mode and play the video above.
        {"\n\n"}
        If configured correctly, you should still hear the audio.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    marginVertical: 20,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  instructions: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 20,
  },
});
