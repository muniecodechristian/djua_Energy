import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View 
          style={[
            styles.progress, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    width: 120,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#FF5C00',
    borderRadius: 2,
  },
});
