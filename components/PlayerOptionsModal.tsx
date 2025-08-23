// components/PlayerOptionsModal.tsx (versão completa e corrigida)

import React from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import useTheme from '../hooks/useTheme';
import { Player } from '../types';

interface PlayerOptionsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  winRate: number | null;
  onClose: () => void;
  onDelete: (playerId: string) => void;
  onUpdateWeight: (player: Player) => void;
  onEditName: () => void;
  onChangePhoto: (player: Player) => void;
  onRemovePhoto: (playerId: string) => void;
}

const PlayerOptionsModal: React.FC<PlayerOptionsModalProps> = ({
  visible, player, darkMode, winRate, onClose, onDelete, onUpdateWeight, onEditName, onChangePhoto, onRemovePhoto
}) => {
  const theme = useTheme(darkMode);

  if (!player) return null;

  const handleDelete = () => {
    onClose();
    onDelete(player.id);
  };

  const handleUpdateWeight = () => {
    onUpdateWeight(player);
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover a foto deste jogador e voltar para o avatar padrão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Remover",
          style: "destructive",
          onPress: () => {
            onRemovePhoto(player.id);
            onClose();
          },
        },
      ]
    );
  };

  const imageSource = player.photoUri
    ? { uri: player.photoUri }
    : require('../assets/images/default-avatar.png');

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              
              <TouchableOpacity 
                onPress={() => onChangePhoto(player)}
                onLongPress={player.photoUri ? handleRemovePhoto : undefined}
              >
                <Image source={imageSource} style={styles.avatar} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: theme.text }]}>{player.name}</Text>
              <View style={styles.statsContainer}>
                <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                  Nível: {player.weight}
                </Text>
                {/* Só mostra a taxa de vitória se ela existir (jogador já jogou) */}
                {winRate !== null && (
                  <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                    • Taxa de Vitória: {winRate}%
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onEditName}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Editar Nome</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accentGreen }]}
                onPress={handleUpdateWeight}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Alterar Nível</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.danger }]}
                onPress={handleDelete}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Apagar Jogador</Text>
              </TouchableOpacity>

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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#555',
    marginBottom: 12,
    alignSelf: 'center',
  },
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
});

export default PlayerOptionsModal;