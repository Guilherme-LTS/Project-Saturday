// components/PlayerOptionsModal.tsx (versão com todas as melhorias)

import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import useTheme from '../hooks/useTheme';
import { Player } from '../types';

interface PlayerOptionsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  onClose: () => void;
  onDelete: (playerId: string) => void;
  // MUDANÇA 3: A prop mudou para receber o peso diretamente
  onUpdateWeight: (playerId: string, newWeight: 1 | 2 | 3) => void; 
}

const PlayerOptionsModal: React.FC<PlayerOptionsModalProps> = ({
  visible,
  player,
  darkMode,
  onClose,
  onDelete,
  onUpdateWeight,
}) => {
  const theme = useTheme(darkMode);

  if (!player) {
    return null;
  }

  const handleDelete = () => {
    onClose(); 
    onDelete(player.id);
  };

  // MUDANÇA 3: Lógica para ciclar o peso
  const handleUpdateWeight = () => {
    const currentWeight = player.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3; // Lógica para ciclar: 1->2, 2->3, 3->1
    onUpdateWeight(player.id, nextWeight);
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
                Opções para {player.name}
              </Text>
              <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                Peso atual: {player.weight}
              </Text>

              {/* MUDANÇA 3: O botão de editar agora cicla o peso */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleUpdateWeight}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                  Alterar Peso
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.danger }]}
                onPress={handleDelete}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                  Apagar Jogador
                </Text>
              </TouchableOpacity>

              {/* MUDANÇA 1: O botão de cancelar agora é só um texto */}
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
  // ... (modalOverlay, modalView, modalTitle, modalSubTitle continuam iguais)
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
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 16,
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
  // MUDANÇA 1: Estilos para o novo botão de cancelar
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

export default PlayerOptionsModal;