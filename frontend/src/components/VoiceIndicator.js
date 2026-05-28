import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function VoiceIndicator({ isRecording }) {
  if (!isRecording) return null;

  // Create individual animated heights for the soundwave bars
  const anim1 = useRef(new Animated.Value(10)).current;
  const anim2 = useRef(new Animated.Value(10)).current;
  const anim3 = useRef(new Animated.Value(10)).current;
  const anim4 = useRef(new Animated.Value(10)).current;
  const anim5 = useRef(new Animated.Value(10)).current;

  // Bouncing animations looping in parallel
  useEffect(() => {
    const createBouncingLoop = (value, min, max, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: max,
            duration: duration,
            useNativeDriver: false
          }),
          Animated.timing(value, {
            toValue: min,
            duration: duration,
            useNativeDriver: false
          })
        ])
      );
    };

    const loop1 = createBouncingLoop(anim1, 10, 45, 450);
    const loop2 = createBouncingLoop(anim2, 10, 60, 500);
    const loop3 = createBouncingLoop(anim3, 10, 35, 380);
    const loop4 = createBouncingLoop(anim4, 10, 50, 420);
    const loop5 = createBouncingLoop(anim5, 10, 40, 480);

    Animated.parallel([loop1, loop2, loop3, loop4, loop5]).start();

    return () => {
      // Clean up animations on unmount
      anim1.stopAnimation();
      anim2.stopAnimation();
      anim3.stopAnimation();
      anim4.stopAnimation();
      anim5.stopAnimation();
    };
  }, [anim1, anim2, anim3, anim4, anim5]);

  return (
    <View style={styles.container}>
      <View style={styles.waveBox}>
        {/* Animated wave bars */}
        <Animated.View style={[styles.bar, { height: anim1 }]} />
        <Animated.View style={[styles.bar, { height: anim2, marginHorizontal: 6 }]} />
        <Animated.View style={[styles.bar, { height: anim3 }]} />
        <Animated.View style={[styles.bar, { height: anim4, marginHorizontal: 6 }]} />
        <Animated.View style={[styles.bar, { height: anim5 }]} />
      </View>
      
      <Text style={styles.recordText}>Listening & Transcribing...</Text>
      <Text style={styles.subText}>Speak clearly now. Click the mic again to send.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 16, 26, 0.95)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 100,
  },
  waveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
  },
  bar: {
    width: 6,
    backgroundColor: '#818cf8',
    borderRadius: 3,
  },
  recordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  subText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
});
