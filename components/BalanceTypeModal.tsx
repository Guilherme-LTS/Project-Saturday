import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import useTheme from '../hooks/useTheme';

// Define o tipo para o modo de balanceamento, agora com 'fundamentals'
type BalanceMode = 'level' | 'winrate' | 'fundamentals';

interface BalanceTypeModalProps {
  visible: boolean;
  darkMode: boolean;
  onClose: () => void;
  onSelectMode: (mode: BalanceMode) => void;
}

const BalanceTypeModal: React.FC<BalanceTypeModalProps> = ({
  visible,
  darkMode,
  onClose,
  onSelectMode,
}) => {
  const theme = useTheme(darkMode);

  const handleSelect = (mode: BalanceMode) => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Tipo de Balanceamento</Text>

              {/* Botão para balancear por fundamentos */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => handleSelect('fundamentals')}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Fundamentos</Text>
              </TouchableOpacity>

              {/* Botão para balancear por nível */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => handleSelect('level')}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Nível</Text>
              </TouchableOpacity>

              {/* Botão para balancear por vitórias */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => handleSelect('winrate')}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Vitórias</Text>
              </TouchableOpacity>

              {/* Botão de cancelar */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>Cancelar</Text>
              </TouchableOpacity>
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
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
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

export default BalanceTypeModal;
