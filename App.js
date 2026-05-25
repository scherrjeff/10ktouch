import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import CompleteScreen from './src/screens/CompleteScreen';
import StatsScreen from './src/screens/StatsScreen';

export default function App() {
  const [screen, setScreen]           = useState('home');
  const [finalTouches, setFinalTouches] = useState(0);
  const [finalTime, setFinalTime]       = useState(0);

  const handleWorkoutComplete = (touches, time) => {
    setFinalTouches(touches);
    setFinalTime(time);
    setScreen('complete');
  };

  const handleRestart = () => {
    setFinalTouches(0);
    setFinalTime(0);
    setScreen('home');
  };

  if (screen === 'workout') {
    return <WorkoutScreen onComplete={handleWorkoutComplete} />;
  }
  if (screen === 'complete') {
    return (
      <CompleteScreen
        completedTouches={finalTouches}
        totalTime={finalTime}
        onRestart={handleRestart}
        onStats={() => setScreen('stats')}
      />
    );
  }
  if (screen === 'stats') {
    return <StatsScreen onBack={() => setScreen(finalTouches > 0 ? 'complete' : 'home')} />;
  }

  return (
    <HomeScreen
      onStart={() => setScreen('workout')}
      onStats={() => setScreen('stats')}
    />
  );
}
