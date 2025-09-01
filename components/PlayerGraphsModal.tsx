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
import { Circle, Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { usePlayersStore } from '../stores/playersStore';
import { Match, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';
import PlayerSelectModal from './PlayerSelectModal';

const PlusIcon = ({ color = 'white', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ color = 'white', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SynergyItem = ({ player, winRate, label, theme }: { player: Player; winRate: number; label: string; theme: any }) => (
  <View style={styles.synergyItem}>
    <Text style={[styles.synergyLabel, { color: theme.placeholder }]}>{label}</Text>
    <PlayerAvatar player={player} size={40} theme={theme} />
    <Text style={[styles.synergyName, { color: theme.text }]} numberOfLines={1}>
      {player.name.split(' ')[0]}
    </Text>
    <Text style={[styles.synergyWinRate, { color: winRate >= 50 ? theme.accentGreen : theme.accentRed }]}>
      {Math.round(winRate)}%
    </Text>
  </View>
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
  const [comparisonMode, setComparisonMode] = useState<'partner' | 'opponent'>('opponent');
  const [isOpponentModalVisible, setOpponentModalVisible] = useState(false);

  const allPlayers = usePlayersStore(state => state.allPlayers);
  const theme = useTheme(darkMode);

  const handleClose = () => {
    setSelectedOpponent(null);
    setComparisonMode('opponent');
    onClose();
  };

  const synergyStats = useMemo(() => {
    if (!player || matchHistory.length === 0) return null;

    const otherPlayers = allPlayers.filter(p => p.id !== player.id);
    const partnerStats: { player: Player; winRate: number; games: number }[] = [];
    const opponentStats: { player: Player; winRate: number; games: number }[] = [];

    otherPlayers.forEach(otherPlayer => {
      let gamesAsPartner = 0,
        winsAsPartner = 0;
      let gamesAsOpponent = 0,
        winsAsOpponent = 0;

      matchHistory.forEach(match => {
        const playerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === player.id));
        const otherPlayerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === otherPlayer.id));

        if (playerTeamIndex === -1 || otherPlayerTeamIndex === -1) return;

        if (playerTeamIndex === otherPlayerTeamIndex) {
          gamesAsPartner++;
          if (match.winnerTeamIndex === playerTeamIndex) winsAsPartner++;
        } else {
          gamesAsOpponent++;
          if (match.winnerTeamIndex === playerTeamIndex) winsAsOpponent++;
        }
      });

      if (gamesAsPartner > 0) {
        partnerStats.push({ player: otherPlayer, winRate: (winsAsPartner / gamesAsPartner) * 100, games: gamesAsPartner });
      }
      if (gamesAsOpponent > 0) {
        opponentStats.push({ player: otherPlayer, winRate: (winsAsOpponent / gamesAsOpponent) * 100, games: gamesAsOpponent });
      }
    });

    const minGames = 3;
    const validPartnerStats = partnerStats.filter(s => s.games >= minGames);
    const validOpponentStats = opponentStats.filter(s => s.games >= minGames);

    if (validPartnerStats.length === 0 && validOpponentStats.length === 0) return null;

    validPartnerStats.sort((a, b) => b.winRate - a.winRate);
    validOpponentStats.sort((a, b) => b.winRate - a.winRate);

    return {
      bestPartner: validPartnerStats.length > 0 ? validPartnerStats[0] : null,
      worstPartner: validPartnerStats.length > 1 ? validPartnerStats[validPartnerStats.length - 1] : null,
      bestOpponent: validOpponentStats.length > 0 ? validOpponentStats[0] : null,
      worstOpponent: validOpponentStats.length > 1 ? validOpponentStats[validOpponentStats.length - 1] : null,
    };
  }, [player, matchHistory, allPlayers]);

  const chartData = useMemo(() => {
    if (!player || matchHistory.length < 2) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    const dailyStats: { [key: string]: { wins: number; total: number } } = {};
    const contextualStats: { [key: string]: { wins: number; total: number } } = {};

    matchHistory.forEach(match => {
      const date = new Date(match.date).toLocaleDateString('pt-BR');
      if (!dailyStats[date]) {
        dailyStats[date] = { wins: 0, total: 0 };
        contextualStats[date] = { wins: 0, total: 0 };
      }

      const playerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === player.id));
      if (playerTeamIndex === -1) return;

      dailyStats[date].total++;
      if (playerTeamIndex === match.winnerTeamIndex) {
        dailyStats[date].wins++;
      }

      if (selectedOpponent) {
        const otherPlayerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === selectedOpponent.id));
        if (otherPlayerTeamIndex === -1) return;

        const arePartners = playerTeamIndex === otherPlayerTeamIndex;
        const areOpponents = playerTeamIndex !== otherPlayerTeamIndex;

        if ((comparisonMode === 'partner' && arePartners) || (comparisonMode === 'opponent' && areOpponents)) {
          contextualStats[date].total++;
          if (playerTeamIndex === match.winnerTeamIndex) {
            contextualStats[date].wins++;
          }
        }
      }
    });

    const sortedDates = Object.keys(dailyStats).sort(
      (a, b) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime()
    );

    const labels = sortedDates.map(date => date.slice(0, 5));
    const overallData = sortedDates.map(date => {
      const { wins, total } = dailyStats[date];
      return total > 0 ? Math.round((wins / total) * 100) : 0;
    });

    const datasets: any[] = [
      {
        data: overallData,
        color: (opacity = 1) => theme.accentYellow,
        strokeWidth: 2,
      },
    ];

    if (selectedOpponent) {
      const contextualData = sortedDates.map(date => {
        const { wins, total } = contextualStats[date];
        return total > 0 ? Math.round((wins / total) * 100) : -1;
      });

      const filteredContextualData = contextualData.map(value => (value === -1 ? null : value));

      datasets.push({
        data: filteredContextualData,
        color: (opacity = 1) => (comparisonMode === 'partner' ? theme.accentGreen : theme.accentRed),
        strokeWidth: 3,
      });
    }

    return {
      labels,
      datasets,
    };
  }, [player, matchHistory, theme, selectedOpponent, comparisonMode]);

  const chartConfig = {
    decimalPlaces: 0,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => theme.accentYellow,
    labelColor: (opacity = 1) => theme.placeholder,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.card,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4',
      stroke: theme.placeholder,
      strokeWidth: 0.5,
      opacity: 0.5,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const opponents = useMemo(() => {
    if (!player) return [];
    return allPlayers.filter(p => p.id !== player.id);
  }, [allPlayers, player]);

  const winRateWithOrAgainst = useMemo(() => {
    if (!player || !selectedOpponent || !matchHistory) return null;

    let wins = 0;
    let totalGames = 0;

    matchHistory.forEach(match => {
      const playerTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === player.id));
      const opponentTeamIndex = match.teams.findIndex(team => team.players.some(p => p.id === selectedOpponent.id));

      const areOpponents = playerTeamIndex !== opponentTeamIndex;
      const arePartners = playerTeamIndex === opponentTeamIndex;

      if (playerTeamIndex !== -1 && opponentTeamIndex !== -1) {
        if (comparisonMode === 'opponent' && areOpponents) {
          totalGames++;
          if (playerTeamIndex === match.winnerTeamIndex) {
            wins++;
          }
        } else if (comparisonMode === 'partner' && arePartners) {
          totalGames++;
          if (playerTeamIndex === match.winnerTeamIndex) {
            wins++;
          }
        }
      }
    });

    if (totalGames < 3) return 'Poucos jogos';
    return `${Math.round((wins / totalGames) * 100)}%`;
  }, [player, selectedOpponent, matchHistory, comparisonMode]);

  if (!player) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <XIcon color={theme.placeholder} size={24} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Estatísticas de {player.name}</Text>

              {synergyStats && (
                <View style={styles.synergyContainer}>
                  <View style={styles.synergyRow}>
                    {synergyStats.bestPartner && <SynergyItem player={synergyStats.bestPartner.player} winRate={synergyStats.bestPartner.winRate} label="Melhor Dupla" theme={theme} />}
                    {synergyStats.worstPartner && <SynergyItem player={synergyStats.worstPartner.player} winRate={synergyStats.worstPartner.winRate} label="Pior Dupla" theme={theme} />}
                    {synergyStats.bestOpponent && <SynergyItem player={synergyStats.bestOpponent.player} winRate={synergyStats.bestOpponent.winRate} label="Freguês" theme={theme} />}
                    {synergyStats.worstOpponent && <SynergyItem player={synergyStats.worstOpponent.player} winRate={synergyStats.worstOpponent.winRate} label="Carrasco" theme={theme} />}
                  </View>
                </View>
              )}

              <View style={styles.separator} />

              <View style={{ paddingVertical: 16 }}>
                <Text style={[styles.chartTitle, { color: theme.text }]}>Taxa de Vitória</Text>
                <LineChart
                  data={chartData}
                  width={Dimensions.get('window').width * 0.85}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisSuffix="%"
                  fromZero
                  withHorizontalLines
                  withVerticalLines
                  withShadow={false}
                />
              </View>

              <View style={styles.comparisonContainer}>
                <View style={styles.playerAvatarContainer}>
                  <PlayerAvatar player={player} size={60} theme={theme} />
                  <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.comparisonToggle,
                    { backgroundColor: comparisonMode === 'partner' ? theme.accentGreen : theme.accentRed },
                  ]}
                  onPress={() => setComparisonMode(prev => (prev === 'opponent' ? 'partner' : 'opponent'))}
                >
                  {comparisonMode === 'partner' ? (
                    <PlusIcon color={theme.primaryText} />
                  ) : (
                    <XIcon color={theme.primaryText} />
                  )}
                </TouchableOpacity>

                <View style={styles.playerAvatarContainer}>
                  <TouchableOpacity
                    style={[styles.playerButton, { borderColor: theme.placeholder, borderWidth: selectedOpponent ? 0 : 2 }]}
                    onPress={() => setOpponentModalVisible(true)}
                  >
                    {selectedOpponent ? (
                      <PlayerAvatar player={selectedOpponent} size={60} theme={theme} />
                    ) : (
                      <Text style={{ color: theme.placeholder, fontSize: 10 }}>Selecionar</Text>
                    )}
                  </TouchableOpacity>
                  {selectedOpponent && (
                    <Text style={[styles.playerName, { color: theme.text }]}>{selectedOpponent.name}</Text>
                  )}
                </View>
              </View>

              {winRateWithOrAgainst && (
                <Text
                  style={[
                    styles.winrateText,
                    { color: winRateWithOrAgainst === 'Poucos jogos' ? theme.placeholder : theme.text },
                  ]}
                >
                  {winRateWithOrAgainst}
                </Text>
              )}

              <PlayerSelectModal
                visible={isOpponentModalVisible}
                players={opponents}
                darkMode={darkMode}
                onClose={() => setOpponentModalVisible(false)}
                onSelectPlayer={player => {
                  setSelectedOpponent(player);
                  setOpponentModalVisible(false);
                }}
                title={comparisonMode === 'partner' ? 'Selecionar Dupla' : 'Selecionar Oponente'}
              />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '92%',
    maxHeight: '95%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'stretch',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  chart: {
    alignSelf: 'center',
  },
  chartTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  playerAvatarContainer: {
    alignItems: 'center',
    width: 80,
  },
  playerName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  comparisonToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playerButton: {
    width: 70,
    height: 70,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  winrateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  synergyContainer: {
    marginBottom: 10,
  },
  synergyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  synergyItem: {
    alignItems: 'center',
    width: '24%',
  },
  synergyLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  synergyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  synergyWinRate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PlayerGraphsModal;
