import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import useTheme from '../hooks/useTheme';
import { Team } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface TeamCardProps {
  team: Team;
  teamNumber: number;
  darkMode: boolean;
  isWinner: boolean;
  onSelectWinner: () => void;
  balanceMode: 'level' | 'winrate' | 'fundamentals';
}

const TeamCard: React.FC<TeamCardProps> = ({
  team, teamNumber, darkMode, isWinner, onSelectWinner, balanceMode
}) => {
  const theme = useTheme(darkMode);

  const getBalanceText = () => {
    switch (balanceMode) {
      case 'level':
        return `Nível Total: ${(team.total / team.players.length).toFixed(2)}`;
      case 'winrate':
        return `Média Vitórias: ${team.total.toFixed(1)}%`;
      case 'fundamentals':
        return `Pontos Totais: ${team.total}`;
      default:
        return '';
    }
  };

  return (
    // The entire card is now a TouchableOpacity for selecting the winner
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.card, 
          borderColor: isWinner ? theme.accentGreen : theme.cardInactive,
          // Add a subtle shadow or elevation when selected
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
        {/* Visual indicator for the winner */}
        {isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.accentGreen}]} />}
        {!isWinner && <View style={[styles.winnerIndicator, {backgroundColor: theme.cardInactive}]} />}
      </View>

      {/* Player list now uses a two-column grid layout */}
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
        {balanceMode === 'fundamentals' && team.fundamentals && (
            <Text style={[styles.fundamentalsText, { color: theme.placeholder }]}>
                S:{team.fundamentals.serve} P:{team.fundamentals.passing} L:{team.fundamentals.setting} A:{team.fundamentals.attacking} B:{team.fundamentals.blocking}
            </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    overflow: 'hidden', // Ensures inner content respects the border radius
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
  // New styles for the grid layout
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  playerCell: {
    width: '50%', // Each cell takes up half the width
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 10,
  },
  playerName: {
    fontSize: 15,
    flex: 1, // Allows text to shrink if needed
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
  fundamentalsText: {
      fontSize: 11,
      marginTop: 4,
      textAlign: 'center',
  }
});

export default TeamCard;
