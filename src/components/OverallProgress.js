import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TOTAL_TOUCHES } from '../data/drills';
import { formatTime } from '../utils/format';

const MILESTONE_STEP = 1000;

export default function OverallProgress({ completedTouches, currentDrillIndex, totalDrills, workoutElapsed }) {
  const percent = TOTAL_TOUCHES > 0 ? completedTouches / TOTAL_TOUCHES : 0;

  const milestones = [];
  for (let m = MILESTONE_STEP; m < TOTAL_TOUCHES; m += MILESTONE_STEP) {
    milestones.push(m);
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Overall Progress</Text>
        <View style={styles.rightRow}>
          {workoutElapsed != null && (
            <Text style={styles.timer}>⏱ {formatTime(workoutElapsed)}  </Text>
          )}
          <Text style={styles.count}>
            {completedTouches.toLocaleString()} / {TOTAL_TOUCHES.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Track with milestone markers */}
      <View style={styles.trackWrapper}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(percent * 100, 100)}%` }]} />
        </View>

        {milestones.map((m) => {
          const pos = m / TOTAL_TOUCHES;
          const reached = completedTouches >= m;
          return (
            <View
              key={m}
              style={[
                styles.tick,
                { left: `${pos * 100}%` },
                reached ? styles.tickReached : styles.tickPending,
              ]}
            />
          );
        })}
      </View>

      {/* Milestone labels */}
      <View style={styles.labelsRow}>
        {milestones.map((m) => {
          const pos = m / TOTAL_TOUCHES;
          const reached = completedTouches >= m;
          return (
            <Text
              key={m}
              style={[
                styles.tickLabel,
                { left: `${pos * 100}%` },
                reached ? styles.tickLabelReached : styles.tickLabelPending,
              ]}
            >
              {m / 1000}k
            </Text>
          );
        })}
      </View>

      <Text style={styles.drillCounter}>
        Drill {Math.min(currentDrillIndex + 1, totalDrills)} of {totalDrills}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#0D1117',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timer: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  count: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  trackWrapper: {
    position: 'relative',
    height: 8,
    marginBottom: 0,
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  tick: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    marginLeft: -1,
    borderRadius: 1,
  },
  tickReached: {
    backgroundColor: '#4ADE80',
  },
  tickPending: {
    backgroundColor: '#374151',
  },
  labelsRow: {
    position: 'relative',
    height: 16,
    marginTop: 3,
  },
  tickLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: -8,
    textAlign: 'center',
    width: 16,
  },
  tickLabelReached: {
    color: '#4ADE80',
  },
  tickLabelPending: {
    color: '#374151',
  },
  drillCounter: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
});
