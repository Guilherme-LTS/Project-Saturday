import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { usePlayersStore } from '../stores/playersStore';
import { Match, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';
import PlayerSelectModal from './PlayerSelectModal';

const VersusIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 17.5l4-4-4-4" />
    <Path d="M20 6.5l-4 4 4 4" />
    <Path d="M8 13.5h8" />
  </Svg>
);

interface PlayerGraphsModalProps {
  visible: boolean;
  player: Player | null;
  darkMode: boolean;
  matchHistory: Match[];
  onClose: () => void;
}

const PlayerGraphsModal: React.FC<PlayerGraphsModalProps> = ({ visible, player, darkMode, matchHistory, onClose }) => {
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);

  const handleClose = () => {
    setSelectedOpponent(null);
    onClose();
  };
  const allPlayers = usePlayersStore((state) => state.allPlayers);
    const [isOpponentModalVisible, setOpponentModalVisible] = useState(false);
  const theme = useTheme(darkMode);

  const chartData = useMemo(() => {
    if (!player || matchHistory.length < 2) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    const dailyStats: { [key: string]: { wins: number; total: number } } = {};

    matchHistory.forEach(match => {
      const date = new Date(match.date).toLocaleDateString('pt-BR');
      if (!dailyStats[date]) {
        dailyStats[date] = { wins: 0, total: 0 };
      }

      const playerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === player.id));

      if (playerTeamIndex === match.winnerTeamIndex) {
        dailyStats[date].wins += 1;
      }
      dailyStats[date].total += 1;
    });

    const sortedDates = Object.keys(dailyStats).sort((a, b) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime());

    const labels = sortedDates.map(date => date.slice(0, 5));
    const data = sortedDates.map(date => {
      const { wins, total } = dailyStats[date];
      return Math.round((wins / total) * 100);
    });

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => theme.accentGreen,
          strokeWidth: 3,
        },
      ],
    };
  }, [player, matchHistory, theme]);

  const chartConfig = {
    decimalPlaces: 0,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => theme.accentGreen,
    labelColor: (opacity = 1) => theme.placeholder,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.accentGreen,
    },
  };

  const opponents = useMemo(() => {
    if (!player) return [];
    return allPlayers.filter((p) => p.id !== player.id);
  }, [allPlayers, player]);

  const winrateAgainstOpponent = useMemo(() => {
    if (!player || !selectedOpponent || !matchHistory) return null;

    let wins = 0;
    let totalGames = 0;

    matchHistory.forEach((match) => {
      const playerTeamIndex = match.teams.findIndex((team) => team.players.some((p) => p.id === player.id));
      const opponentTeamIndex = match.teams.findIndex((team) => team.players.some((p) => p.id === selectedOpponent.id));

      if (playerTeamIndex !== -1 && opponentTeamIndex !== -1 && playerTeamIndex !== opponentTeamIndex) {
        totalGames++;
        if (playerTeamIndex === match.winnerTeamIndex) {
          wins++;
        }
      }
    });

    if (totalGames === 0) return 'N/A';
    return `${Math.round((wins / totalGames) * 100)}%`;
  }, [player, selectedOpponent, matchHistory]);

  if (!player) return null;

  return (
    <Modal transparent visible={visible} animationType="fade"
        onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Estatísticas de {player.name}
              </Text>
                            {chartData.labels.length > 1 ? (
                <LineChart
                  data={chartData}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                  withOuterLines={false}
                  fromZero
                  withShadow
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={[styles.noDataText, { color: theme.placeholder }]}>
                    Não há dados suficientes para exibir o gráfico de vitórias.
                  </Text>
                </View>
              )}
              <View style={styles.separator} />

              <View style={styles.comparisonContainer}>
                                <View style={styles.pairingRow}>
                  <View style={styles.playerAvatarContainer}>
                    <PlayerAvatar player={player} size={60} theme={theme} />
                    <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
                  </View>
                  <Text style={[styles.vsText, { color: theme.placeholder }]}>VS</Text>
                  <TouchableOpacity style={[styles.playerButton, { borderColor: theme.placeholder, borderWidth: selectedOpponent ? 0 : 2 }]} onPress={() => setOpponentModalVisible(true)}>
                    {selectedOpponent ? (
                      <View style={styles.playerAvatarContainer}>
                        <PlayerAvatar player={selectedOpponent} size={60} theme={theme} />
                        <Text style={[styles.playerName, { color: theme.text }]}>{selectedOpponent.name}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: theme.placeholder, fontSize: 10 }}>Selecionar</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {selectedOpponent && (
                  <Text style={[styles.winrateText, { color: theme.text, marginTop: 15 }]}>
                    {winrateAgainstOpponent}
                  </Text>
                )}
              </View>
              <PlayerSelectModal
                visible={isOpponentModalVisible}
                players={opponents}
                darkMode={darkMode}
                onClose={() => setOpponentModalVisible(false)}
                onSelectPlayer={(opponent) => setSelectedOpponent(opponent)}
                title="Selecione um Oponente"
              />

              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>Voltar</Text>
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
    width: '92%',
    maxHeight: '95%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 10,
    marginTop: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  comparisonContainer: {
    alignItems: 'center',
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pairingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  playerAvatarContainer: {
    alignItems: 'center',
    width: 80,
  },
  playerName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerButton: {
    minWidth: 80,
    minHeight: 90,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  winrateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default PlayerGraphsModal;
