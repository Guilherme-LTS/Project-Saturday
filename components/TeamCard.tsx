import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import useTheme from '../hooks/useTheme';
import { Match, Team } from '../types';
import { calculateWinProbability } from '../utils/winProbabilityCalculator';
import PlayerAvatar from './PlayerAvatar';
import FireIcon from '../assets/icons/fire.svg';
import { getCurrentWinStreak } from '../utils/helpers';
import { useGameStore } from '../stores/gameStore';
import DraggablePlayer from './DraggablePlayer';

interface TeamCardProps {
  team: Team;
  teamNumber: number;
  darkMode: boolean;
  isWinner: boolean;
  onSelectWinner: () => void;
  balanceMode: 'level' | 'winrate' | 'fundamentals';
  // New props for win probability
  opposingTeam?: Team;
  matchHistory?: Match[];
  showCourtView?: boolean;
  streakIconSize?: number;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team, 
  teamNumber, 
  darkMode, 
  isWinner, 
  onSelectWinner, 
  balanceMode,
  opposingTeam,
  matchHistory = [],
  showCourtView = true,
  streakIconSize,
}) => {
  const theme = useTheme(darkMode);
  const { teamDisplayNames } = useGameStore();
  const fireSize = streakIconSize ?? 12;

  const getBalanceText = () => {
    switch (balanceMode) {
      case 'level':
        return `Nível Total: ${(team.total / team.players.length).toFixed(2)}`;
      case 'winrate':
        return `Média Vitórias: ${(team.total / team.players.length).toFixed(1)}%`;
      case 'fundamentals':
        return `Pontos Totais: ${team.total}`;
      default:
        return '';
    }
  };

  // Calculate win probability (number) when not showing court view
  const currentTeamWinProb = (!opposingTeam || showCourtView) ? null : (() => {
    const { team1WinProb, team2WinProb } = calculateWinProbability(
      teamNumber === 1 ? team : opposingTeam,
      teamNumber === 1 ? opposingTeam : team,
      matchHistory,
      balanceMode
    );
    return teamNumber === 1 ? team1WinProb : team2WinProb;
  })();

  // --- Stats for non-court view ---
  const fundamentalsTotal = team.fundamentals
    ? Object.values(team.fundamentals).reduce((sum, v) => sum + v, 0)
    : 0;

  const averageLevel = team.players.length > 0
    ? team.players.reduce((sum, p) => sum + p.weight, 0) / team.players.length
    : 0;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.card, 
          borderColor: isWinner ? theme.accentGreen : theme.cardInactive,
          shadowColor: isWinner ? theme.accentGreen : '#000',
          shadowOpacity: isWinner ? 0.3 : 0.1,
          shadowRadius: isWinner ? 5 : 2,
          elevation: isWinner ? 5 : 2,
        }
      ]}
      onPress={onSelectWinner}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>{(teamDisplayNames?.[teamNumber - 1] || `Time ${teamNumber}`)}</Text>
          {currentTeamWinProb !== null && (
            <Text style={[styles.headerWinProb, { color: theme.accentGreen }]}>{currentTeamWinProb.toFixed(1)}%</Text>
          )}
        </View>
        {isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.accentGreen}]} />}
        {!isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.cardInactive}]} />}
      </View>

      <View style={styles.playerGrid}>
        {team.players.map(player => (
          <DraggablePlayer 
            key={player.id} 
            teamIndex={teamNumber - 1} 
            playerId={player.id} 
            style={styles.playerCell}
            onTap={onSelectWinner}
          >
            <View style={{ position: 'relative' }}>
              {getCurrentWinStreak(player.id, matchHistory || []) >= 3 && (
                <View style={[styles.streakBadge, { top: -Math.round(fireSize/3), right: -Math.round(fireSize/3) }]}>
                  <FireIcon width={fireSize} height={fireSize} fill="#ff3b30" />
                </View>
              )}
              <PlayerAvatar player={player} size={36} theme={theme} />
            </View>
            <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
              {player.name}
            </Text>
          </DraggablePlayer>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.cardInactive }]}>
        {showCourtView ? (
          <Text style={[styles.total, { color: theme.placeholder }]}>{getBalanceText()}</Text>
        ) : (
          <View style={styles.statsContainer}>
            <Text style={[styles.total, { color: theme.placeholder }]}>Pontos Fundamentos (total): {fundamentalsTotal}</Text>
            <Text style={[styles.total, { color: theme.placeholder }]}>Nível (média): {averageLevel.toFixed(2)}</Text>
          </View>
        )}
        
        {balanceMode === 'fundamentals' && team.fundamentals && (
          <Text style={[styles.fundamentalsText, { color: theme.placeholder }]}>
            S:{team.fundamentals.serve} R:{team.fundamentals.passing} L:{team.fundamentals.setting} A:{team.fundamentals.attacking} B:{team.fundamentals.blocking}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerWinProb: {
    fontSize: 14,
    fontWeight: '600',
  },
  winnerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  playerCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 10,
  },
  playerName: {
    fontSize: 15,
    flex: 1,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  total: {
    fontSize: 14,
    fontWeight: '500',
  },
  winProbabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  fundamentalsText: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    gap: 2,
  },
  streakBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
});

export default TeamCard;