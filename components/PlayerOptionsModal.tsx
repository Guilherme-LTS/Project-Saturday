import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import useTheme from '../hooks/useTheme';
import { Match, Player } from '../types';
import { calculatePlayerStats } from '../utils/helpers';
import { pickImageFromGallery, takePhotoWithCamera } from '../utils/imageUtils';
import PlayerAvatar from './PlayerAvatar';

interface PlayerOptionsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  matchHistory: Match[];
  onClose: () => void;
  onDelete: (playerId: string) => void;
  onUpdateWeight: (player: Player) => void;
  onEditName: () => void;
  onChangePhoto: (player: Player, photoUri: string) => void;
  onRemovePhoto: (playerId: string) => void;
}

const PlayerOptionsModal: React.FC<PlayerOptionsModalProps> = ({
  visible, player, darkMode, matchHistory, onClose, onDelete, onUpdateWeight, 
  onEditName, onChangePhoto, onRemovePhoto
}) => {
  const theme = useTheme(darkMode);

  if (!player) return null;

  const stats = calculatePlayerStats(player.id, matchHistory);

  const handleDelete = () => {
    onClose();
    onDelete(player.id);
  };

  const handleUpdateWeight = () => {
    onUpdateWeight(player);
  };

  const showPhotoOptions = () => {
    const options = [
      'Escolher da Galeria',
      'Tirar Foto',
      ...(player.photoUri ? ['Remover Foto'] : []),
      'Cancelar'
    ];

    const destructiveButtonIndex = player.photoUri ? options.length - 2 : -1;
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: 'Alterar Foto do Jogador'
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            // Escolher da Galeria
            const imageUri = await pickImageFromGallery();
            if (imageUri) {
              onChangePhoto(player, imageUri);
            }
          } else if (buttonIndex === 1) {
            // Tirar Foto
            const imageUri = await takePhotoWithCamera();
            if (imageUri) {
              onChangePhoto(player, imageUri);
            }
          } else if (buttonIndex === destructiveButtonIndex) {
            // Remover Foto
            handleRemovePhoto();
          }
        }
      );
    } else {
      // Android Alert
      Alert.alert(
        'Alterar foto do jogador',
        'Escolha uma opção:',
        [
          { text: 'Cancelar', style: 'cancel' as const },
          { text: (player.photoUri ? 'Trocar Foto' : 'Adicionar Foto'),
            onPress: () => {
              Alert.alert(
                (player.photoUri ? 'Trocar Foto' : 'Adicionar Foto'),
                'De onde você quer pegar a foto?',
                [
                  {
                    text: 'Galeria',
                    onPress: async () => {
                      const imageUri = await pickImageFromGallery();
                      if (imageUri) onChangePhoto(player, imageUri);
                    }
                  },
                  {
                    text: 'Câmera',
                    onPress: async () => {
                      const imageUri = await takePhotoWithCamera();
                      if (imageUri) onChangePhoto(player, imageUri);
                    }
                  },
                ],
                { cancelable: true }
              );
              console.log('Adicionando foto de:', player.name);
            }
          },
          ...(player.photoUri ? [{
            text: 'Remover Foto',
            style: 'destructive' as const,
            onPress: handleRemovePhoto
          }] : []),
        ],
        { cancelable: true }
      );
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover a foto deste jogador?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: () => {
            onRemovePhoto(player.id);
            onClose();
            console.log('Removendo foto de:', player.name);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              
              <TouchableOpacity 
                onPress={showPhotoOptions}
                style={styles.avatarContainer}
                activeOpacity={0.7}
              >
                <PlayerAvatar player={player} size={100} theme={theme} />
                <Text style={[styles.avatarHint, { color: theme.placeholder }]}>
                  Toque para alterar foto
                </Text>
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: theme.text }]}>{player.name}</Text>
              
              <View style={styles.statsContainer}>
                <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                  Nível: {player.weight}
                </Text>
                
                {stats.winRate !== null && (
                  <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                    • Vitória: {stats.winRate}% ({stats.gamesPlayed} jogos)
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
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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
    flexWrap: 'wrap',
  },
});

export default PlayerOptionsModal;