import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import YoutubePlayerWeb from '../components/YoutubePlayerWeb';
import { useKeepAwake } from 'expo-keep-awake';
import { DRILLS, TOTAL_TOUCHES } from '../data/drills';
import { saveWorkout } from '../services/storage';
import { formatTime, todayISO } from '../utils/format';
import OverallProgress from '../components/OverallProgress';
import SetDots from '../components/SetDots';
import MilestoneBanner from '../components/MilestoneBanner';

export default function WorkoutScreen({ onComplete }) {
  useKeepAwake();

  const [drillIndex, setDrillIndex]             = useState(0);
  const [currentSet, setCurrentSet]             = useState(1);
  const [completedTouches, setCompletedTouches] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [showExitModal, setShowExitModal]       = useState(false);
  const [activeMilestone, setActiveMilestone]   = useState(null);

  // Timers
  const [workoutElapsed, setWorkoutElapsed] = useState(0);
  const [drillElapsed, setDrillElapsed]     = useState(0);
  const workoutStartRef = useRef(Date.now());
  const drillStartRef   = useRef(Date.now());
  const drillTimesRef   = useRef({});

  // Tracks which sets have been completed: Set of "drillIndex-setNum" keys
  const completedSetsRef   = useRef(new Set());
  // Furthest drill index reached (for payload when navigating back before finishing)
  const maxDrillReachedRef = useRef(0);

  const prevTouchesRef = useRef(0);
  const playerRef      = useRef(null);

  const drill       = DRILLS[drillIndex];
  const isLastSet   = currentSet === drill.sets;
  const isLastDrill = drillIndex === DRILLS.length - 1;

  // True when the current set was already completed (user navigated back to it)
  const currentSetKey  = `${drillIndex}-${currentSet}`;
  const alreadyDone    = completedSetsRef.current.has(currentSetKey);
  const drillComplete  = Array.from({ length: drill.sets }, (_, s) =>
    completedSetsRef.current.has(`${drillIndex}-${s + 1}`)
  ).every(Boolean);

  // Overall workout timer
  useEffect(() => {
    const id = setInterval(() => {
      setWorkoutElapsed(Math.floor((Date.now() - workoutStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Per-drill timer — resets when drill changes; frozen on completed drills
  useEffect(() => {
    const isDrillDone = Array.from({ length: DRILLS[drillIndex].sets }, (_, s) =>
      completedSetsRef.current.has(`${drillIndex}-${s + 1}`)
    ).every(Boolean);

    if (isDrillDone) {
      setDrillElapsed(drillTimesRef.current[drillIndex] ?? 0);
      return;
    }

    drillStartRef.current = Date.now();
    setDrillElapsed(0);
    const id = setInterval(() => {
      setDrillElapsed(Math.floor((Date.now() - drillStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [drillIndex]);

  // Seek to this drill's start position when drill changes
  useEffect(() => {
    playerRef.current?.seekTo(drill.startTime ?? 0, true);
  }, [drillIndex]);

  // Loop video within drill's time window (native only)
  useEffect(() => {
    if (!drill.endTime) return;
    const id = setInterval(() => {
      if (!playerRef.current) return;
      playerRef.current.getCurrentTime().then((t) => {
        if (t >= drill.endTime) {
          playerRef.current.seekTo(drill.startTime ?? 0, true);
        }
      });
    }, 500);
    return () => clearInterval(id);
  }, [drillIndex]);

  // Milestone detection
  useEffect(() => {
    const prev = prevTouchesRef.current;
    const curr = completedTouches;
    for (let m = 1000; m <= TOTAL_TOUCHES; m += 1000) {
      if (prev < m && curr >= m) { setActiveMilestone(m); break; }
    }
    prevTouchesRef.current = curr;
  }, [completedTouches]);

  const recordDrillTime = useCallback((idx) => {
    drillTimesRef.current[idx] = Math.floor((Date.now() - drillStartRef.current) / 1000);
  }, []);

  const buildWorkoutPayload = useCallback((finalTouches, isComplete) => {
    const totalTime = Math.floor((Date.now() - workoutStartRef.current) / 1000);
    const maxIdx = maxDrillReachedRef.current;
    const drills = DRILLS.slice(0, maxIdx + 1).map((d, i) => {
      const drillDone = Array.from({ length: d.sets }, (_, s) =>
        completedSetsRef.current.has(`${i}-${s + 1}`)
      ).every(Boolean);
      const drillTouches = Array.from({ length: d.sets }, (_, s) =>
        completedSetsRef.current.has(`${i}-${s + 1}`) ? d.repsPerSet : 0
      ).reduce((a, b) => a + b, 0);
      return {
        drillId:   d.id,
        name:      d.name,
        time:      drillTimesRef.current[i] ?? 0,
        touches:   drillTouches,
        completed: drillDone,
      };
    });
    return {
      id:          Date.now().toString(),
      date:        todayISO(),
      startedAt:   new Date(workoutStartRef.current).toISOString(),
      completedAt: new Date().toISOString(),
      totalTime,
      totalTouches: finalTouches,
      isComplete,
      drills,
    };
  }, []);

  // Navigate back one set (or to the last set of the previous drill)
  const handlePrev = useCallback(() => {
    setPlaying(false);
    if (currentSet > 1) {
      setCurrentSet(s => s - 1);
    } else if (drillIndex > 0) {
      setDrillIndex(i => i - 1);
      setCurrentSet(DRILLS[drillIndex - 1].sets);
    }
  }, [currentSet, drillIndex]);

  const handleDone = useCallback(() => {
    setPlaying(false);

    // Only count touches the first time this set is completed
    let newTotal = completedTouches;
    if (!alreadyDone) {
      completedSetsRef.current = new Set([...completedSetsRef.current, currentSetKey]);
      newTotal = completedTouches + drill.repsPerSet;
      setCompletedTouches(newTotal);
    }

    // Navigate forward within the drill
    if (!isLastSet) {
      setCurrentSet(s => s + 1);
      return;
    }

    // Last set of this drill — record time only on first completion
    if (!alreadyDone) recordDrillTime(drillIndex);

    if (isLastDrill) {
      const payload = buildWorkoutPayload(newTotal, true);
      saveWorkout(payload);
      onComplete(newTotal, payload.totalTime);
      return;
    }

    const nextIdx = drillIndex + 1;
    if (nextIdx > maxDrillReachedRef.current) maxDrillReachedRef.current = nextIdx;
    setDrillIndex(nextIdx);
    setCurrentSet(1);
  }, [isLastSet, isLastDrill, completedTouches, alreadyDone, currentSetKey, drill, drillIndex, recordDrillTime, buildWorkoutPayload, onComplete]);

  const isAtStart = drillIndex === 0 && currentSet === 1;

  const doneBtnLabel = alreadyDone
    ? (isLastSet ? (isLastDrill ? 'FINISH WORKOUT' : 'NEXT DRILL  →') : `NEXT SET  →`)
    : (isLastSet ? (isLastDrill ? 'FINISH WORKOUT' : 'NEXT DRILL  →') : `DONE  ·  SET ${currentSet + 1} NEXT`);

  const touchesThisDrill =
    currentSet < drill.sets
      ? `Set ${currentSet} of ${drill.sets} — ${drill.repsPerSet} touches`
      : `Final Set — ${drill.repsPerSet} touches`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      <OverallProgress
        completedTouches={completedTouches}
        currentDrillIndex={drillIndex}
        totalDrills={DRILLS.length}
        workoutElapsed={workoutElapsed}
      />

      <MilestoneBanner
        milestone={activeMilestone}
        onDismiss={() => setActiveMilestone(null)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.drillHeader}>
          <View style={styles.drillTitleRow}>
            <Text style={styles.drillNumber}>Drill {drillIndex + 1}</Text>
            <View style={styles.drillTitleRight}>
              {drillComplete && (
                <View style={styles.completeBadge}>
                  <Text style={styles.completeBadgeText}>✓ DRILL DONE</Text>
                </View>
              )}
              <Text style={styles.drillTimer}>⏱ {formatTime(drillElapsed)}</Text>
            </View>
          </View>
          <Text style={styles.drillName}>{drill.name}</Text>
          <Text style={styles.drillMeta}>
            {drill.sets} set{drill.sets > 1 ? 's' : ''} × {drill.repsPerSet} reps ·{' '}
            <Text style={styles.touchCount}>{drill.totalTouches} touches</Text>
          </Text>
        </View>

        <View style={styles.videoContainer}>
          {Platform.OS === 'web' ? (
            <YoutubePlayerWeb
              videoId={drill.youtubeId}
              startTime={drill.startTime}
              endTime={drill.endTime}
              height={210}
            />
          ) : (
            <YoutubePlayer
              ref={playerRef}
              height={210}
              play={playing}
              videoId={drill.youtubeId}
              initialPlayerParams={{ start: drill.startTime ?? 0 }}
              onChangeState={(state) => { if (state === 'ended') setPlaying(false); }}
            />
          )}
        </View>

        <View style={styles.setSection}>
          <View style={styles.setLabelRow}>
            <Text style={styles.setLabel}>{touchesThisDrill}</Text>
            {alreadyDone && (
              <View style={styles.setDoneBadge}>
                <Text style={styles.setDoneBadgeText}>✓ SET DONE</Text>
              </View>
            )}
          </View>
          <SetDots totalSets={drill.sets} currentSet={currentSet} />
        </View>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>HOW TO DO IT</Text>
          <Text style={styles.instructionsText}>{drill.instructions}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => setShowExitModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>

        {!isAtStart && (
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrev} activeOpacity={0.7}>
            <Text style={styles.prevText}>← PREV</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.doneBtn, alreadyDone && styles.doneBtnSkip]}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={[styles.doneBtnText, alreadyDone && styles.doneBtnSkipText]}>{doneBtnLabel}</Text>
        </TouchableOpacity>
      </View>

      {showExitModal && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Exit Workout?</Text>
            <Text style={styles.modalBody}>
              You've logged {completedTouches.toLocaleString()} touches in{' '}
              {formatTime(workoutElapsed)}. Progress will not be saved.
            </Text>
            <TouchableOpacity
              style={styles.modalKeepBtn}
              onPress={() => setShowExitModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalKeepText}>KEEP GOING</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalExitBtn}
              onPress={() => {
                setShowExitModal(false);
                recordDrillTime(drillIndex);
                const payload = buildWorkoutPayload(completedTouches, false);
                saveWorkout(payload);
                onComplete(completedTouches, payload.totalTime);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalExitConfirmText}>EXIT WORKOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0D1117' },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  drillHeader:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  drillTitleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  drillTitleRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drillNumber:        { color: '#22C55E', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  completeBadge:      { backgroundColor: '#14532D', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  completeBadgeText:  { color: '#22C55E', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  drillTimer:    { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  drillName:     { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30 },
  drillMeta:     { color: '#6B7280', fontSize: 13, marginTop: 4 },
  touchCount:    { color: '#F59E0B', fontWeight: '700' },
  videoContainer: {
    marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937',
  },
  setSection:       { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  setLabelRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setLabel:         { color: '#D1D5DB', fontSize: 15, fontWeight: '600' },
  setDoneBadge:     { backgroundColor: '#14532D', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  setDoneBadgeText: { color: '#22C55E', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  instructionsBox:  { marginHorizontal: 16, backgroundColor: '#111827', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1F2937' },
  instructionsTitle: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  instructionsText:  { color: '#D1D5DB', fontSize: 14, lineHeight: 22 },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: '#111827', backgroundColor: '#0D1117',
  },
  exitBtn:      { paddingHorizontal: 16, height: 56, backgroundColor: '#1F2937', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exitText:     { color: '#9CA3AF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  prevBtn:      { paddingHorizontal: 16, height: 56, backgroundColor: '#1F2937', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  prevText:     { color: '#9CA3AF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  doneBtn:          { flex: 1, backgroundColor: '#22C55E', borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center' },
  doneBtnSkip:      { backgroundColor: '#1F2937' },
  doneBtnText:      { color: '#0D1117', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  doneBtnSkipText:  { color: '#9CA3AF' },
  overlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 },
  modalCard:    { width: '100%', backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1F2937' },
  modalTitle:   { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  modalBody:    { color: '#9CA3AF', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  modalKeepBtn: { backgroundColor: '#22C55E', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  modalKeepText: { color: '#0D1117', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  modalExitBtn:  { backgroundColor: '#1F2937', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  modalExitConfirmText: { color: '#EF4444', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
