import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import useTheme from '../hooks/useTheme';
import { Match, Team } from '../types';
import { calculateWinProbability } from '../utils/winProbabilityCalculator';
import PlayerAvatar from './PlayerAvatar';

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
  showCourtView = true
}) => {
  const theme = useTheme(darkMode);

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

  // Calculate win probability when court view is not showing and opposing team exists
  const getWinProbabilityText = () => {
    if (!opposingTeam || showCourtView) return null;
    
    const { team1WinProb, team2WinProb } = calculateWinProbability(
      teamNumber === 1 ? team : opposingTeam,
      teamNumber === 1 ? opposingTeam : team,
      matchHistory,
      balanceMode
    );
    
    const currentTeamProb = teamNumber === 1 ? team1WinProb : team2WinProb;
    return `Chance de vitória: ${currentTeamProb.toFixed(1)}%`;
  };

  const winProbabilityText = getWinProbabilityText();

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
        <Text style={[styles.title, { color: theme.text }]}>Time {teamNumber}</Text>
        {isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.accentGreen}]} />}
        {!isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.cardInactive}]} />}
      </View>

      <View style={styles.playerGrid}>
        {team.players.map(player => (
          <View key={player.id} style={styles.playerCell}>
            <PlayerAvatar player={player} size={36} theme={theme} />
            <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
              {player.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.cardInactive }]}>
        <Text style={[styles.total, { color: theme.placeholder }]}>{getBalanceText()}</Text>
        
        {/* Show win probability when court view is disabled */}
        {winProbabilityText && (
          <Text style={[styles.winProbabilityText, { color: theme.accentGreen }]}>
            {winProbabilityText}
          </Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
  }
});

export default TeamCard;