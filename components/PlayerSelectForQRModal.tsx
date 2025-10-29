import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Hooks
import useTheme from '../hooks/useTheme';

// Types
import { Player } from '../types';

// Components
import PlayerCard from './PlayerCard';

interface PlayerSelectForQRModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

const PlayerSelectForQRModal: React.FC<PlayerSelectForQRModalProps> = ({
  visible,
  onClose,
  darkMode,
  players,
  onSelectPlayer,
}) => {
  const theme = useTheme(darkMode);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Selecione o Jogador
          </Text>
          <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
            Escolha o jogador para gerar o QR Code
          </Text>
          
          <ScrollView style={styles.playerList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerItem}>
                <PlayerCard
                  player={player}
                  darkMode={darkMode}
                  onToggleActive={() => {}}
                  variant="list"
                  selectable={true}
                  isSelected={false}
                  hideCheckbox={true}
                  onSelect={() => {
                    console.log('DEBUG - Player selected:', player.name);
                    onSelectPlayer(player);
                  }}
                  onLongPress={() => {}}
                  matchHistory={[]}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  playerList: {
    width: '100%',
  },
  playerItem: {
    marginBottom: 8,
    width: '100%',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PlayerSelectForQRModal;