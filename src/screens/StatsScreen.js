import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { getStats } from '../services/storage';
import { DRILLS } from '../data/drills';
import { formatTime, formatDate } from '../utils/format';

export default function StatsScreen({ onBack }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((s) => { setStats(s); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#22C55E" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const { totalWorkouts, totalTouches, totalTime, streak, longestStreak,
          drillRecords, bestWorkoutTime, recentWorkouts } = stats;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stats</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          {longestStreak > 0 && (
            <Text style={styles.streakBest}>Best: {longestStreak} days</Text>
          )}
        </View>

        {/* Overview cards */}
        <View style={styles.overviewRow}>
          <StatCard label="Workouts" value={totalWorkouts} />
          <StatCard label="Touches" value={totalTouches.toLocaleString()} />
          <StatCard label="Total Time" value={formatTime(totalTime)} />
        </View>

        {bestWorkoutTime != null && (
          <View style={styles.prBanner}>
            <Text style={styles.prBannerLabel}>🏆  Best Workout Time</Text>
            <Text style={styles.prBannerValue}>{formatTime(bestWorkoutTime)}</Text>
          </View>
        )}

        {/* Personal Records per drill */}
        <Text style={styles.sectionTitle}>Personal Records — By Drill</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNum, styles.colHead]}>#</Text>
            <Text style={[styles.colName, styles.colHead]}>Drill</Text>
            <Text style={[styles.colTime, styles.colHead]}>Best Time</Text>
            <Text style={[styles.colRuns, styles.colHead]}>Runs</Text>
          </View>
          {DRILLS.map((drill, i) => {
            const rec = drillRecords[drill.id];
            return (
              <View key={drill.id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={styles.colNum}>{drill.id}</Text>
                <Text style={styles.colName} numberOfLines={1}>{drill.name}</Text>
                <Text style={[styles.colTime, rec && styles.colTimeHit]}>
                  {rec ? formatTime(rec.fastestTime) : '—'}
                </Text>
                <Text style={styles.colRuns}>{rec ? rec.completions : '—'}</Text>
              </View>
            );
          })}
        </View>

        {/* Recent workouts */}
        {recentWorkouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {recentWorkouts.map((w) => (
              <View key={w.id} style={styles.workoutRow}>
                <View style={styles.workoutLeft}>
                  <Text style={styles.workoutDate}>{formatDate(w.startedAt)}</Text>
                  <Text style={styles.workoutSub}>
                    {w.drills.length} drill{w.drills.length !== 1 ? 's' : ''} · {w.totalTouches.toLocaleString()} touches
                  </Text>
                </View>
                <View style={styles.workoutRight}>
                  <Text style={styles.workoutTime}>{formatTime(w.totalTime)}</Text>
                  <View style={[styles.badge, w.isComplete ? styles.badgeComplete : styles.badgePartial]}>
                    <Text style={styles.badgeText}>{w.isComplete ? 'Complete' : 'Partial'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {recentWorkouts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workouts yet. Start training!</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#111827' },
  backBtn:      { width: 60 },
  backText:     { color: '#22C55E', fontSize: 15, fontWeight: '600' },
  headerTitle:  { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

  scroll: { padding: 20, paddingBottom: 48 },

  streakCard: { backgroundColor: '#111827', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  streakEmoji: { fontSize: 44, marginBottom: 8 },
  streakCount: { color: '#22C55E', fontSize: 56, fontWeight: '900', lineHeight: 60 },
  streakLabel: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  streakBest:  { color: '#374151', fontSize: 12, marginTop: 4 },

  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:    { flex: 1, backgroundColor: '#111827', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  statValue:   { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel:   { color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

  prBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#14532D', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 24, borderWidth: 1, borderColor: '#22C55E' },
  prBannerLabel: { color: '#86EFAC', fontSize: 14, fontWeight: '600' },
  prBannerValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

  sectionTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },

  table:       { backgroundColor: '#111827', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937', marginBottom: 28 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  tableRowAlt: { backgroundColor: '#0D1117' },
  colHead:     { color: '#6B7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  colNum:      { width: 28, color: '#4B5563', fontSize: 12 },
  colName:     { flex: 1, color: '#D1D5DB', fontSize: 12, paddingRight: 8 },
  colTime:     { width: 64, color: '#4B5563', fontSize: 12, textAlign: 'right' },
  colTimeHit:  { color: '#22C55E', fontWeight: '700' },
  colRuns:     { width: 36, color: '#4B5563', fontSize: 12, textAlign: 'right' },

  workoutRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111827' },
  workoutLeft: { flex: 1 },
  workoutDate: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  workoutSub:  { color: '#6B7280', fontSize: 12, marginTop: 2 },
  workoutRight: { alignItems: 'flex-end', gap: 4 },
  workoutTime:  { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  badge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeComplete: { backgroundColor: '#14532D' },
  badgePartial:  { backgroundColor: '#1F2937' },
  badgeText:     { fontSize: 10, fontWeight: '700', color: '#86EFAC' },

  empty:     { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#374151', fontSize: 15 },
});
