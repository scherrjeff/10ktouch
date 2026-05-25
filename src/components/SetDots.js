import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SetDots({ totalSets, currentSet }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSets }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < currentSet - 1 && styles.dotDone,
            i === currentSet - 1 && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  dotDone: {
    backgroundColor: '#166534',
    borderColor: '#22C55E',
  },
  dotActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
});
