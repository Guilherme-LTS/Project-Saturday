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
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { Match, Player, PlayerFundamentals } from '../types';
import { calculatePlayerStats } from '../utils/helpers';
import { pickImageFromGallery, takePhotoWithCamera } from '../utils/imageUtils';
import PlayerAvatar from './PlayerAvatar';

// --- SVG Star Icon ---
const StarIcon = ({ filled, color, size = 28 }: { filled: boolean; color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.5}
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </Svg>
);

// --- SVG Edit Icon ---
const EditIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></Path>
    </Svg>
);

// --- SVG X Close Icon ---
const CloseIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18"></Path>
        <Path d="M6 6l12 12"></Path>
    </Svg>
);


// --- Custom Rating Component ---
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
        <TouchableOpacity key={ratingValue} onPress={() => onValueChange(ratingValue)} activeOpacity={0.7}>
          <StarIcon
            filled={ratingValue <= value}
            color={ratingValue <= value ? color : inactiveColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};


const FUNDAMENT_KEYS: (keyof PlayerFundamentals)[] = ['serve', 'passing', 'setting', 'attacking', 'blocking'];
const FUNDAMENT_LABELS: Record<keyof PlayerFundamentals, string> = {
  serve: 'Saque',
  passing: 'Passe',
  setting: 'Levantamento',
  attacking: 'Ataque',
  blocking: 'Bloqueio',
};


// --- The Unified Player Stats Modal ---
interface PlayerStatsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  matchHistory: Match[];
  onClose: () => void;
  onDelete: (playerId: string) => void;
  onUpdateWeight: (player: Player) => void;
  onEditName: () => void;
  onSaveFundamentals: (playerId: string, fundamentals: PlayerFundamentals) => void;
  onChangePhoto: (player: Player, photoUri: string) => void;
  onRemovePhoto: (playerId: string) => void;
}

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  visible, player, darkMode, matchHistory, onClose, onDelete, onUpdateWeight, 
  onEditName, onChangePhoto, onRemovePhoto, onSaveFundamentals
}) => {
  const theme = useTheme(darkMode);
  
  const [fundamentals, setFundamentals] = React.useState<PlayerFundamentals>({
    serve: 3, passing: 3, setting: 3, attacking: 3, blocking: 3,
  });

  React.useEffect(() => {
    if (player?.fundamentals) {
      setFundamentals(player.fundamentals);
    } else {
      setFundamentals({ serve: 3, passing: 3, setting: 3, attacking: 3, blocking: 3 });
    }
  }, [player?.id]);

  if (!player) return null;

  const stats = calculatePlayerStats(player.id, matchHistory);

  const updateFundament = (fundament: keyof PlayerFundamentals, value: 1 | 2 | 3 | 4 | 5) => {
    const newFundamentals = { ...fundamentals, [fundament]: value };
    setFundamentals(newFundamentals);
    onSaveFundamentals(player.id, newFundamentals);
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
          onPress: () => onRemovePhoto(player.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeletePlayer = () => {
    Alert.alert(
      "Apagar Jogador",
      `Tem certeza que deseja apagar ${player.name}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => onDelete(player.id),
        },
      ],
      { cancelable: true }
    );
  };

  const showPhotoSourceOptions = () => {
    Alert.alert(
      "Escolha uma fonte",
      "",
      [
        { text: "Galeria", onPress: async () => {
            const uri = await pickImageFromGallery();
            if (uri) onChangePhoto(player, uri);
        }},
        { text: "Câmera", onPress: async () => {
            const uri = await takePhotoWithCamera();
            if (uri) onChangePhoto(player, uri);
        }},
        { text: "Cancelar", style: "cancel" }
      ],
      { cancelable: true }
    );
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
        const options = player.photoUri
            ? ['Trocar Foto', 'Remover Foto', 'Cancelar']
            : ['Adicionar Foto', 'Cancelar'];
        const destructiveButtonIndex = player.photoUri ? 1 : -1;
        const cancelButtonIndex = options.length - 1;

        ActionSheetIOS.showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
            },
            (buttonIndex) => {
                if (player.photoUri) {
                    if (buttonIndex === 0) showPhotoSourceOptions();
                    else if (buttonIndex === 1) handleRemovePhoto();
                } else {
                    if (buttonIndex === 0) showPhotoSourceOptions();
                }
            }
        );
        return;
    }

    if (player.photoUri) {
      Alert.alert(
        'Alterar Foto',
        '',
        [
          { text: 'Remover Foto', onPress: handleRemovePhoto, style: 'destructive' },
          { text: 'Trocar Foto', onPress: showPhotoSourceOptions },
          { text: 'Cancelar', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        'Adicionar Foto',
        '',
        [
          { text: 'Adicionar Foto', onPress: showPhotoSourceOptions },
          { text: 'Cancelar', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const calculateAverage = () => {
    const sum = Object.values(fundamentals).reduce((acc, val) => acc + val, 0);
    return (sum / 5).toFixed(1);
  };

  const getTitleStyle = (name: string) => {
    const baseSize = 22;
    const smallSize = 18;
    const verySmallSize = 16;
    
    if (name.length > 20) {
      return { fontSize: verySmallSize, lineHeight: verySmallSize };
    } else if (name.length > 15) {
      return { fontSize: smallSize, lineHeight: smallSize };
    }
    return { fontSize: baseSize, lineHeight: baseSize };
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>

              {/* --- Close Button --- */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <CloseIcon color={theme.placeholder} size={24} />
              </TouchableOpacity>

              {/* --- Player Header --- */}
              <View style={styles.playerHeaderContainer}>
                <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
                  <PlayerAvatar player={player} size={120} theme={theme} />
                </TouchableOpacity>
                <View style={styles.playerInfoContainer}>
                    {/* Top-aligned content */}
                    <View>
                        <TouchableOpacity onPress={onEditName} style={styles.modalTitleContainer} activeOpacity={0.7}>
                            <EditIcon color={theme.placeholder} size={16}/>
                            <Text style={[
                              styles.modalTitle, 
                              { color: theme.text },
                              getTitleStyle(player.name)
                            ]} numberOfLines={2}>
                              {player.name}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Bottom-aligned content */}
                    <View>
                        <View style={styles.statsContainer}>
                                {stats.winRate !== null && (
                                <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                                    Vitória: {stats.winRate}%
                                </Text>
                                )}
                                {stats.winRate !== null && (
                                <Text style={[styles.modalSubTitle, { color: theme.placeholder }]}>
                                •
                                </Text>
                                )}
                                <Text style={[styles.modalSubTitle, { color: theme.accentYellow, fontWeight: 'bold' }]}>
                                Média: {calculateAverage()}
                                </Text>
                        </View>
                        <View style={styles.buttonGrid}>
                            <TouchableOpacity style={[styles.gridButton, { backgroundColor: theme.accentGreen }]} onPress={() => onUpdateWeight(player)}>
                            <Text style={[styles.buttonText]}>Nível: {player.weight}</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                </View>
              </View>

              <View style={styles.fundamentalsContainer}>
                {FUNDAMENT_KEYS.map((key) => (
                    <View key={key} style={styles.fundamentRow}>
                        <Text style={[styles.fundamentLabel, { color: theme.text }]}>
                            {FUNDAMENT_LABELS[key]}:
                        </Text>
                        <Rating
                            value={fundamentals[key]}
                            onValueChange={(value) => updateFundament(key, value)}
                            color={theme.accentYellow}
                            inactiveColor={theme.placeholder}
                        />
                    </View>
                ))}
              </View>
              <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.danger }]} onPress={handleDeletePlayer}>
                <Text style={[styles.buttonText]}>Apagar</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)' 
  },
  modalView: { 
    width: '92%', 
    maxHeight: '95%', 
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'stretch' 
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
    padding: 4,
  },
  playerHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10, // Add margin to account for close button
    gap: 16,
  },
  playerInfoContainer: {
    flex: 1,
    alignSelf: 'stretch', // Ensures it takes full height of the parent
    justifyContent: 'space-between', // Pushes content to top and bottom
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 22,
  },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 10,
  },
  modalSubTitle: { 
    fontSize: 14, 
  },
  fundamentalsContainer: { 
    marginTop: 10,
    marginBottom: 10,
  },
  buttonGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10,
    marginTop: 12, // Added margin to separate from stats
  },
  gridButton: { 
    flex: 1, 
    borderRadius: 8, 
    paddingVertical: 12, // Increased padding for a better feel
    alignItems: 'center' 
  },
  buttonText: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    textAlign: 'center', 
    color: '#FFFFFF' 
  },
  fundamentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fundamentLabel: {
    fontSize: 20,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  deleteButton: {
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  }
});

export default PlayerStatsModal;