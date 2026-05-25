import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { TOTAL_TOUCHES } from '../data/drills';

const MESSAGES = {
  1000:  { emoji: '🔥', headline: '1,000 Touches!',  sub: "Great start — keep the energy up!" },
  2000:  { emoji: '⚡', headline: '2,000 Touches!',  sub: "Building that muscle memory!" },
  3000:  { emoji: '💪', headline: '3,000 Touches!',  sub: "You're on fire — don't stop!" },
  4000:  { emoji: '🎯', headline: '4,000 Touches!',  sub: "40% done. Dig in!" },
  5000:  { emoji: '🌟', headline: '5,000 Touches!',  sub: "Halfway there — Elite level work!" },
  6000:  { emoji: '🚀', headline: '6,000 Touches!',  sub: "60% done — keep pushing!" },
  7000:  { emoji: '🏃', headline: '7,000 Touches!',  sub: "70% done — you've got this!" },
  8000:  { emoji: '😤', headline: '8,000 Touches!',  sub: "80% done — final push!" },
  9000:  { emoji: '🔑', headline: '9,000 Touches!',  sub: "90% done — finish strong!" },
  [TOTAL_TOUCHES]: { emoji: '🏆', headline: 'Complete!', sub: "You became Elite today!" },
};

export default function MilestoneBanner({ milestone, onDismiss }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!milestone) return;

    opacity.setValue(0);
    translateY.setValue(-16);

    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 350, useNativeDriver: true }),
      ]).start(() => onDismiss?.());
    }, 2800);

    return () => clearTimeout(timer);
  }, [milestone]);

  const data = MESSAGES[milestone];
  if (!milestone || !data) return null;

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.emoji}>{data.emoji}</Text>
      <View style={styles.text}>
        <Text style={styles.headline}>{data.headline}</Text>
        <Text style={styles.sub}>{data.sub}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532D',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 28,
  },
  text: {
    flex: 1,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sub: {
    color: '#86EFAC',
    fontSize: 13,
    marginTop: 1,
  },
});
