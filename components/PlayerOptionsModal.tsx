// components/PlayerOptionsModal.tsx (versão atualizada)

import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// 1. Importar o que precisamos
import useTheme from '../hooks/useTheme';
import { Match, Player } from '../types';
import { calculatePlayerStats } from '../utils/helpers';
import PlayerAvatar from './PlayerAvatar';

interface PlayerOptionsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  matchHistory: Match[]; // <-- 2. Mudar a prop
  onClose: () => void;
  onDelete: (playerId: string) => void;
  onUpdateWeight: (player: Player) => void;
  onEditName: () => void;
  onChangePhoto: (player: Player) => void;
  onRemovePhoto: (playerId: string) => void;
}

const PlayerOptionsModal: React.FC<PlayerOptionsModalProps> = ({
  visible, player, darkMode, matchHistory, onClose, onDelete, onUpdateWeight, onEditName, onChangePhoto, onRemovePhoto
}) => {
  const theme = useTheme(darkMode);

  if (!player) return null;

  // 3. Calcular as estatísticas aqui dentro
  const stats = calculatePlayerStats(player.id, matchHistory);

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
      "Tem certeza que deseja remover a foto deste jogador?",
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

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              
              <TouchableOpacity 
                onPress={() => onChangePhoto(player)}
                onLongPress={player.photoUri ? handleRemovePhoto : undefined}
                style={styles.avatarContainer}
              >
                {/* 4. Usar o PlayerAvatar */}
                <PlayerAvatar player={player} size={100} theme={theme} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: theme.text }]}>{player.name}</Text>
              
              <View style={styles.statsContainer}>
                <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                  Nível: {player.weight}
                </Text>
                
                {/* 5. Exibir as novas estatísticas */}
                {stats.winRate !== null && (
                  <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                    •  Vitória: {stats.winRate}% ({stats.gamesPlayed} jogos)
                  </Text>
                )}
              </View>

              {/* Botões de ação (sem alterações na lógica) */}
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
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 12,
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
    flexWrap: 'wrap', // Permite que o texto quebre a linha se não couber
  },
});

export default PlayerOptionsModal;