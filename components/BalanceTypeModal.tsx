import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { Player, PlayerPairing } from '../types';
import PlayerSelectModal from './PlayerSelectModal';

// --- SVG Icons ---
const PlusIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MinusIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrashIcon = ({ color = 'white', size = 16 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);


// --- Pairing Row Component ---
interface PairingRowProps {
    pairing: PlayerPairing;
    players: Player[];
    darkMode: boolean;
    allUsedPlayerIds: string[];
}
const PairingRow: React.FC<PairingRowProps> = ({ pairing, players, darkMode, allUsedPlayerIds }) => {
    const theme = useTheme(darkMode);
    const { updatePlayerPairing, removePlayerPairing } = useGameStore();

    const [isPlayer1ModalVisible, setPlayer1ModalVisible] = useState(false);
    const [isPlayer2ModalVisible, setPlayer2ModalVisible] = useState(false);

    const handleSelectPlayer1 = (player: Player) => {
        updatePlayerPairing(pairing.id, { player1Id: player.id });
    };

    const handleSelectPlayer2 = (player: Player) => {
        updatePlayerPairing(pairing.id, { player2Id: player.id });
    };

    const togglePairingType = () => {
        const newType = pairing.type === 'together' ? 'apart' : 'together';
        updatePlayerPairing(pairing.id, { type: newType });
    };

    const getPlayerName = (playerId: string | null) => {
        if (!playerId) return 'Selecionar';
        return players.find(p => p.id === playerId)?.name ?? 'Selecionar';
    };

    const availablePlayers = players.filter(p => !allUsedPlayerIds.includes(p.id));

    const pairingTypeColor = pairing.type === 'together' ? theme.accentGreen : theme.accentOrange;

    return (
        <>
            <View style={[styles.pairingContainer, { backgroundColor: pairingTypeColor + '20' }]}>
                <TouchableOpacity style={[styles.playerButton, { borderColor: pairingTypeColor + '50' }]} onPress={() => setPlayer1ModalVisible(true)}>
                    <Text style={{ color: theme.text }} numberOfLines={1}>{getPlayerName(pairing.player1Id)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pairingToggle, { backgroundColor: pairingTypeColor }]} onPress={togglePairingType}>
                    {pairing.type === 'together' ? <PlusIcon /> : <MinusIcon />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.playerButton, { borderColor: pairingTypeColor + '50' }]} onPress={() => setPlayer2ModalVisible(true)}>
                    <Text style={{ color: theme.text }} numberOfLines={1}>{getPlayerName(pairing.player2Id)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.trashButton} onPress={() => removePlayerPairing(pairing.id)}>
                    <TrashIcon color={theme.placeholder}/>
                </TouchableOpacity>
            </View>

            <PlayerSelectModal
                visible={isPlayer1ModalVisible}
                players={availablePlayers.filter(p => p.id !== pairing.player2Id)}
                darkMode={darkMode}
                onClose={() => setPlayer1ModalVisible(false)}
                onSelectPlayer={handleSelectPlayer1}
                title="Selecione o Jogador 1"
            />
            <PlayerSelectModal
                visible={isPlayer2ModalVisible}
                players={availablePlayers.filter(p => p.id !== pairing.player1Id)}
                darkMode={darkMode}
                onClose={() => setPlayer2ModalVisible(false)}
                onSelectPlayer={handleSelectPlayer2}
                title="Selecione o Jogador 2"
            />
        </>
    );
};


// --- Main Modal Component ---
type BalanceMode = 'level' | 'winrate' | 'fundamentals';
interface BalanceTypeModalProps {
  visible: boolean;
  darkMode: boolean;
  players: Player[];
  onClose: () => void;
  onSelectMode: (mode: BalanceMode) => void;
}
const BalanceTypeModal: React.FC<BalanceTypeModalProps> = ({ visible, darkMode, players, onClose, onSelectMode }) => {
  const theme = useTheme(darkMode);
  const { playerPairings, addPlayerPairing } = useGameStore();

  const handleSelectMode = (mode: BalanceMode) => {
    onSelectMode(mode);
  };

  const allUsedPlayerIds = playerPairings.flatMap(p => [p.player1Id, p.player2Id]).filter((id): id is string => id !== null);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Opções de Balanceamento</Text>
              
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleSelectMode('fundamentals')}>
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Fundamentos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleSelectMode('level')}>
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Nível</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleSelectMode('winrate')}>
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Balancear por Vitórias</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.cardInactive }]} />

              <View>
                <Text style={[styles.pairingTitle, { color: theme.text }]}>Regras de Sorteio</Text>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    <TouchableOpacity activeOpacity={1}>
                        <View>
                        {playerPairings.map((pairing) => (
                            <PairingRow 
                                key={pairing.id}
                                pairing={pairing}
                                players={players}
                                darkMode={darkMode}
                                allUsedPlayerIds={allUsedPlayerIds.filter(id => id !== pairing.player1Id && id !== pairing.player2Id)}
                            />
                        ))}
                        </View>
                    </TouchableOpacity>
                </ScrollView>
              </View>
              
              <TouchableOpacity style={[styles.addButton, {backgroundColor: theme.primary + '30'}]} onPress={addPlayerPairing}>
                  <Text style={[styles.addButtonText, {color: theme.primary}]}>+ Adicionar Regra</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>Fechar</Text>
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
        width: '90%',
        maxHeight: '85%',
        borderRadius: 12,
        padding: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center'
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 10
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center'
    },
    divider: {
        height: 1,
        marginVertical: 20
    },
    pairingTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16
    },
    scrollView: {
        maxHeight: 200,
        marginBottom: 8
    },
    pairingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 8,
        padding: 4
    },
    playerButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#ffffff10'
    },
    pairingToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6
    },
    trashButton: {
        padding: 8,
        marginLeft: 4
    },
    addButton: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 16
    },
    addButtonText: {
        fontWeight: 'bold',
        fontSize: 15
    },
    cancelButton: {
        padding: 10,
        marginTop: 4
    },
    cancelButtonText: {
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '500'
    },
});

export default BalanceTypeModal;
