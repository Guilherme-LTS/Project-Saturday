// components/TeamSizeSlider.tsx

import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../hooks/useTheme';
import { TeamSize } from '../types';

interface TeamSizeSliderProps {
  value: TeamSize;
  onValueChange: (value: TeamSize) => void;
  darkMode: boolean;
}

const sliderValues: TeamSize[] = [2, 3, 4, 5, 6];

const TeamSizeSlider: React.FC<TeamSizeSliderProps> = ({ value, onValueChange, darkMode }) => {
  const theme = useTheme(darkMode);

  return (
    <View style={styles.container}>
      {/* 1. O Slider em si */}
      <Slider
        style={styles.slider}
        minimumValue={2}
        maximumValue={6}
        step={1} // Isso força o slider a "travar" em números inteiros
        value={value}
        onValueChange={(newValue) => onValueChange(newValue as TeamSize)}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
      />
      {/* 2. Os "Notches" e os números que ficam abaixo */}
      <View style={styles.labelsContainer}>
        {sliderValues.map((num) => (
          <Text key={num} style={[styles.label, { color: value === num ? theme.primary : theme.placeholder }]}>
            {num}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    alignItems: 'stretch',
  },
  slider: {
    height: 40,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TeamSizeSlider;