import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { DRILLS, TOTAL_TOUCHES } from '../data/drills';
import { formatTime } from '../utils/format';

export default function CompleteScreen({ completedTouches, totalTime, onRestart, onStats }) {
  const isFullWorkout = completedTouches >= TOTAL_TOUCHES;
  const percent = Math.round((completedTouches / TOTAL_TOUCHES) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.heroSection}>
          <Text style={styles.trophyEmoji}>{isFullWorkout ? '🏆' : '💪'}</Text>
          <Text style={styles.headline}>
            {isFullWorkout ? 'Workout Complete!' : 'Great Work!'}
          </Text>
          <Text style={styles.subheadline}>
            {isFullWorkout
              ? 'You crushed the full circuit!'
              : `You completed ${percent}% of the workout`}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Touches Completed</Text>
            <Text style={styles.statRowValue}>{completedTouches.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          {totalTime != null && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Time</Text>
                <Text style={styles.statRowValue}>{formatTime(totalTime)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Total in Circuit</Text>
            <Text style={styles.statRowValue}>{TOTAL_TOUCHES.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Drills</Text>
            <Text style={styles.statRowValue}>{DRILLS.length}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Session Progress</Text>
            <Text style={styles.progressPct}>{percent}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(percent, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.statsBtn} onPress={onStats} activeOpacity={0.8}>
            <Text style={styles.statsBtnText}>📊 Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.85}>
            <Text style={styles.restartText}>DO IT AGAIN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.motto}>Become Elite. One touch at a time.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  trophyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subheadline: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 6,
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statRowLabel: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  statRowValue: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressPct: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  actionRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 20 },
  statsBtn: { height: 56, paddingHorizontal: 20, backgroundColor: '#111827', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1F2937' },
  statsBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  restartBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartText: {
    color: '#0D1117',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  motto: {
    color: '#374151',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
