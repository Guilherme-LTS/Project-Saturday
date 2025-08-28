import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import useTheme from '../hooks/useTheme';
import { Player } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface PlayerSelectModalProps {
  visible: boolean;
  players: Player[];
  darkMode: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  title: string;
}

const PlayerSelectModal: React.FC<PlayerSelectModalProps> = ({
  visible,
  players,
  darkMode,
  onClose,
  onSelectPlayer,
  title,
}) => {
  const theme = useTheme(darkMode);

  const handleSelect = (player: Player) => {
    onSelectPlayer(player);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
              <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.playerRow} onPress={() => handleSelect(item)}>
                    <PlayerAvatar player={item} size={40} theme={theme} />
                    <Text style={[styles.playerName, { color: theme.text }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
              />
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
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 15,
  },
  playerName: {
    fontSize: 16,
  },
  separator: {
    height: 1,
  },
  cancelButton: {
    padding: 10,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PlayerSelectModal;