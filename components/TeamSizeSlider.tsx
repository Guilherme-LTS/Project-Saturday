// components/TeamSizeSlider.tsx (versão com alinhamento corrigido)

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

const sliderValues = Array.from({ length: 10 }, (_, i) => i + 2);

const TeamSizeSlider: React.FC<TeamSizeSliderProps> = ({ value, onValueChange, darkMode }) => {
  const theme = useTheme(darkMode);

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={2}
        maximumValue={11}
        step={1}
        value={value}
        onValueChange={(newValue) => onValueChange(newValue as TeamSize)}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
      />
      <View style={styles.labelsContainer}>
        {sliderValues.map((num) => (
          <View key={num} style={styles.labelWrapper}>
            <Text style={[styles.label, { color: value === num ? theme.primary : theme.placeholder }]}>
              {num}
            </Text>
          </View>
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
    paddingHorizontal: 5, 
  },
  labelWrapper: {
    width: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TeamSizeSlider;