import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { DRILLS, TOTAL_TOUCHES } from '../data/drills';
import { getStats } from '../services/storage';
import { formatTime } from '../utils/format';

export default function HomeScreen({ onStart, onStats }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    getStats().then((s) => setStreak(s.streak));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.badge}>⚽  BECOME ELITE</Text>
          <Text style={styles.title}>10,000 Touches</Text>
          <Text style={styles.subtitle}>Full Ball Mastery Circuit</Text>
        </View>

        {streak != null && (
          <TouchableOpacity style={styles.streakBanner} onPress={onStats} activeOpacity={0.8}>
            <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
            <View style={styles.streakText}>
              <Text style={styles.streakCount}>
                {streak > 0 ? `${streak}-Day Streak` : 'No active streak'}
              </Text>
              <Text style={styles.streakSub}>Tap to view all stats →</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{DRILLS.length}</Text>
            <Text style={styles.statLabel}>Drills</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{TOTAL_TOUCHES.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Touches</Text>
          </View>
        </View>

        <View style={styles.drillList}>
          <Text style={styles.sectionTitle}>Workout Overview</Text>
          {DRILLS.map((drill, index) => (
            <View key={drill.id} style={styles.drillRow}>
              <View style={styles.drillNum}>
                <Text style={styles.drillNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.drillName} numberOfLines={1}>{drill.name}</Text>
              <Text style={styles.drillReps}>
                {drill.sets > 1 ? `${drill.sets}×${drill.repsPerSet}` : `${drill.repsPerSet}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.statsBtn} onPress={onStats} activeOpacity={0.8}>
            <Text style={styles.statsBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
            <Text style={styles.startText}>START WORKOUT</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0D1117' },
  scroll: { padding: 24, paddingBottom: 40 },

  header:   { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  badge:    { color: '#22C55E', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title:    { color: '#FFFFFF', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: '#6B7280', fontSize: 15, marginTop: 4, letterSpacing: 0.3 },

  streakBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937', gap: 12 },
  streakEmoji:  { fontSize: 28 },
  streakText:   { flex: 1 },
  streakCount:  { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  streakSub:    { color: '#6B7280', fontSize: 12, marginTop: 1 },

  statsRow: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  stat:         { flex: 1, alignItems: 'center' },
  statValue:    { color: '#22C55E', fontSize: 32, fontWeight: '800' },
  statLabel:    { color: '#6B7280', fontSize: 13, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  statDivider:  { width: 1, height: 40, backgroundColor: '#1F2937', marginHorizontal: 20 },

  sectionTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  drillList:    { marginBottom: 28 },
  drillRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#111827' },
  drillNum:     { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  drillNumText: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  drillName:    { flex: 1, color: '#D1D5DB', fontSize: 14 },
  drillReps:    { color: '#22C55E', fontSize: 13, fontWeight: '700', marginLeft: 8 },

  actionRow: { flexDirection: 'row', gap: 12 },
  statsBtn:  { width: 56, height: 56, backgroundColor: '#111827', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1F2937' },
  statsBtnText: { fontSize: 22 },
  startBtn:  { flex: 1, backgroundColor: '#22C55E', borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center' },
  startText: { color: '#0D1117', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
});
