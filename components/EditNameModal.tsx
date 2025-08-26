// components/EditNameModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import useTheme from '../hooks/useTheme';
import { Player } from '../types';

interface EditNameModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  onClose: () => void;
  onSave: (playerId: string, newName: string) => void;
}

const EditNameModal: React.FC<EditNameModalProps> = ({
  visible,
  player,
  darkMode,
  onClose,
  onSave,
}) => {
  const theme = useTheme(darkMode);
  const [name, setName] = useState('');

  // Preenche o campo de texto com o nome atual do jogador quando o modal abre
  useEffect(() => {
    if (player) {
      setName(player.name);
    }
  }, [player]);

  if (!player) {
    return null;
  }

  const handleSave = () => {
    if (name.trim().length > 0) {
      onSave(player.id, name.trim());
      onClose();
    }
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Editar Nome
              </Text>
              
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.cardInactive, color: theme.text, borderColor: theme.textBlack }]}
                value={name}
                onChangeText={setName}
                placeholder="Nome do jogador"
                placeholderTextColor={theme.placeholder}
                autoFocus={true}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                  Salvar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>
                  Cancelar
                </Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
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

export default EditNameModal;