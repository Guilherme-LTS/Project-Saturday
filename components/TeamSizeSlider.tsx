import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react'; // 1. Importamos useEffect e useRef
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
  
  // 2. Criamos uma "memória" para saber se é a primeira renderização
  const isInitialRender = useRef(true);

  // 3. Este efeito vai observar mudanças no 'value'
  useEffect(() => {
    // Se for a primeira vez que o componente renderiza,
    // apenas marcamos que não é mais a primeira vez e não fazemos nada.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Em todas as outras vezes (quando o usuário mexe no slider),
    // a vibração é ativada.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  }, [value]); // A dependência é o 'value'

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={2}
        maximumValue={11}
        step={1}
        value={value}
        // 4. A chamada de vibração foi removida daqui
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