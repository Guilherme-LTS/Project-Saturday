import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { Player, PlayerFundamentals } from '../types';

// --- SVG Star Icon ---
// A reusable star icon component.
const StarIcon = ({ filled, color, size = 32 }: { filled: boolean; color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.5}
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </Svg>
);

// --- Custom Rating Component ---
// This component mimics the behavior of the MUI Rating component.
interface RatingProps {
  value: number;
  onValueChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  color: string;
  inactiveColor: string;
}
const Rating: React.FC<RatingProps> = ({ value, onValueChange, color, inactiveColor }) => {
  return (
    <View style={styles.ratingContainer}>
      {([1, 2, 3, 4, 5] as const).map((ratingValue) => (
        <TouchableOpacity key={ratingValue} onPress={() => onValueChange(ratingValue)}>
          <StarIcon
            filled={ratingValue <= value}
            color={ratingValue <= value ? color : inactiveColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const FUNDAMENT_LABELS = {
  serve: 'Saque',
  passing: 'Passe',
  setting: 'Levantamento',
  attacking: 'Ataque',
  blocking: 'Bloqueio',
} as const;

const PlayerFundamentalsModal: React.FC<{
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  onClose: () => void;
  onSave: (playerId: string, fundamentals: PlayerFundamentals) => void;
}> = ({ visible, player, darkMode, onClose, onSave }) => {
  const theme = useTheme(darkMode);
  
  const [fundamentals, setFundamentals] = useState<PlayerFundamentals>({
    serve: 3, passing: 3, setting: 3, attacking: 3, blocking: 3,
  });

  useEffect(() => {
    if (player?.fundamentals) {
      setFundamentals(player.fundamentals);
    } else {
      setFundamentals({ serve: 3, passing: 3, setting: 3, attacking: 3, blocking: 3 });
    }
  }, [player]);

  if (!player) return null;

  const updateFundament = (fundament: keyof PlayerFundamentals, value: 1 | 2 | 3 | 4 | 5) => {
    setFundamentals(prev => ({ ...prev, [fundament]: value }));
  };

  const handleSave = () => {
    onSave(player.id, fundamentals);
    onClose();
  };

  const renderFundamentRow = (fundament: keyof PlayerFundamentals) => (
    <View key={fundament} style={styles.fundamentRow}>
      <Text style={[styles.fundamentLabel, { color: theme.text }]}>
        {FUNDAMENT_LABELS[fundament]}:
      </Text>
      {/* Replace the old buttons with the new Rating component */}
      <Rating
        value={fundamentals[fundament]}
        onValueChange={(value) => updateFundament(fundament, value)}
        color={theme.accentYellow}
        inactiveColor={theme.placeholder}
      />
    </View>
  );

  const calculateAverage = () => {
    const sum = Object.values(fundamentals).reduce((acc, val) => acc + val, 0);
    return (sum / 5).toFixed(1);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                Fundamentos - {player.name}
              </Text>
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <TouchableOpacity activeOpacity={1}>
                  <View style={styles.fundamentalsContainer}>
                    {(Object.keys(FUNDAMENT_LABELS) as Array<keyof PlayerFundamentals>).map(renderFundamentRow)}
                  </View>
                  <View style={styles.summaryContainer}>
                    <Text style={[styles.summaryText, { color: theme.placeholder }]}>
                      Média: {calculateAverage()}
                    </Text>
                  </View>
                  <View style={[styles.legendContainer, {borderTopColor: theme.border}]}>
                    <Text style={[styles.legendTitle, { color: theme.text }]}>
                      Escala de Avaliação:
                    </Text>
                    <Text style={[styles.legendText, { color: theme.placeholder }]}>
                      1 - Iniciante • 2 - Básico • 3 - Intermediário • 4 - Avançado • 5 - Expert
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSave}>
                  <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                    Salvar Fundamentos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  fundamentalsContainer: {
    marginBottom: 20,
  },
  fundamentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  fundamentLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  legendContainer: {
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 10,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PlayerFundamentalsModal;
