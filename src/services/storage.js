import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@10k_touches';

async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { workouts: [] };
  } catch {
    return { workouts: [] };
  }
}

async function save(data) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

// Persist a finished (or exited) workout session
export async function saveWorkout(workout) {
  const data = await load();
  data.workouts = [workout, ...data.workouts];
  await save(data);
}

// Return computed stats from the stored workout history
export async function getStats() {
  const { workouts } = await load();

  const totalWorkouts = workouts.length;
  const totalTouches  = workouts.reduce((s, w) => s + w.totalTouches, 0);
  const totalTime     = workouts.reduce((s, w) => s + w.totalTime, 0);

  // Streak — count consecutive calendar days ending today or yesterday
  const streak = calcStreak(workouts);
  const longestStreak = calcLongestStreak(workouts);

  // Per-drill personal records: fastest time to complete the whole drill (all sets)
  const drillRecords = {};
  for (const w of workouts) {
    for (const d of w.drills) {
      if (!d.completed) continue;
      const prev = drillRecords[d.drillId];
      if (!prev || d.time < prev.fastestTime) {
        drillRecords[d.drillId] = {
          fastestTime: d.time,
          completions: (prev?.completions ?? 0) + 1,
        };
      } else {
        drillRecords[d.drillId].completions = (prev.completions ?? 0) + 1;
      }
    }
  }

  // Best full-workout time (completed workouts only)
  const completedWorkouts = workouts.filter((w) => w.isComplete);
  const bestWorkoutTime =
    completedWorkouts.length > 0
      ? Math.min(...completedWorkouts.map((w) => w.totalTime))
      : null;

  return {
    totalWorkouts,
    totalTouches,
    totalTime,
    streak,
    longestStreak,
    drillRecords,
    bestWorkoutTime,
    recentWorkouts: workouts.slice(0, 20),
  };
}

function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const days = uniqueDatesDesc(workouts);
  const today = todayStr(0);
  const yesterday = todayStr(-1);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  return countConsecutive(days);
}

function calcLongestStreak(workouts) {
  if (!workouts.length) return 0;
  const days = uniqueDatesAsc(workouts);
  let best = 1, curr = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
    if (diff === 1) { curr++; best = Math.max(best, curr); }
    else curr = 1;
  }
  return best;
}

function countConsecutive(descendingDays) {
  let streak = 1;
  for (let i = 1; i < descendingDays.length; i++) {
    const diff = (new Date(descendingDays[i - 1]) - new Date(descendingDays[i])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function uniqueDatesDesc(workouts) {
  return [...new Set(workouts.map((w) => w.date))].sort().reverse();
}

function uniqueDatesAsc(workouts) {
  return [...new Set(workouts.map((w) => w.date))].sort();
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
