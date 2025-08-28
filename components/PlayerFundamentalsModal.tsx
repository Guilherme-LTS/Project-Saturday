// components/PlayerFundamentalsModal.tsx

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
import useTheme from '../hooks/useTheme';
import { Player, PlayerFundamentals } from '../types';

interface PlayerFundamentalsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  onClose: () => void;
  onSave: (playerId: string, Fundamentals: PlayerFundamentals) => void;
}

const FUNDAMENT_LABELS = {
  serve: 'Saque',
  passing: 'Passe',
  setting: 'Levantamento',
  attacking: 'Ataque',
  blocking: 'Bloqueio',
} as const;

const PlayerFundamentalsModal: React.FC<PlayerFundamentalsModalProps> = ({
  visible,
  player,
  darkMode,
  onClose,
  onSave,
}) => {
  const theme = useTheme(darkMode);
  
  const [Fundamentals, setFundamentals] = useState<PlayerFundamentals>({
    serve: 3,
    passing: 3,
    setting: 3,
    attacking: 3,
    blocking: 3,
  });

  // Initialize with player's current Fundamentals when modal opens
  useEffect(() => {
    if (player?.fundamentals) {
      setFundamentals(player.fundamentals);
    } else {
      // Default values if player doesn't have Fundamentals yet
      setFundamentals({
        serve: 3,
        passing: 3,
        setting: 3,
        attacking: 3,
        blocking: 3,
      });
    }
  }, [player]);

  if (!player) {
    return null;
  }

  const updateFundament = (fundament: keyof PlayerFundamentals, value: 1 | 2 | 3 | 4 | 5) => {
    setFundamentals(prev => ({
      ...prev,
      [fundament]: value,
    }));
  };

  const handleSave = () => {
    onSave(player.id, Fundamentals);
    onClose();
  };

  const renderFundamentRow = (fundament: keyof PlayerFundamentals) => {
    const currentValue = Fundamentals[fundament];
    const label = FUNDAMENT_LABELS[fundament];

    return (
      <View key={fundament} style={styles.fundamentRow}>
        <Text style={[styles.fundamentLabel, { color: theme.text }]} numberOfLines={1}>
          {label}:
        </Text>
        
        <View style={styles.ratingContainer}>
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.ratingButton,
                {
                  backgroundColor: currentValue === value 
                    ? theme.accentGreen 
                    : theme.cardInactive,
                  borderColor: currentValue === value 
                    ? theme.accentGreen 
                    : theme.textBlack,
                }
              ]}
              onPress={() => updateFundament(fundament, value)}
            >
              <Text
                style={[
                  styles.ratingText,
                  {
                    color: currentValue === value 
                      ? theme.primaryText 
                      : theme.text,
                    fontWeight: currentValue === value ? 'bold' : 'normal',
                  }
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const calculateAverage = () => {
    const sum = Object.values(Fundamentals).reduce((acc, val) => acc + val, 0);
    return (sum / 5).toFixed(1);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}numberOfLines={1}>
                Fundamentos - {player.name}
              </Text>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity activeOpacity={1}>
                    <View style={styles.FundamentalsContainer}>
                      {(Object.keys(FUNDAMENT_LABELS) as Array<keyof PlayerFundamentals>).map(renderFundamentRow)}
                    </View>

                    <View style={styles.summaryContainer}>
                      <Text style={[styles.summaryText, { color: theme.placeholder }]}>
                        Média: {calculateAverage()}
                      </Text>
                    </View>

                    <View style={styles.legendContainer}>
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
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                >
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
  FundamentalsContainer: {
    marginBottom: 20,
  },
  fundamentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
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
  ratingButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
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
    borderTopColor: '#333',
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