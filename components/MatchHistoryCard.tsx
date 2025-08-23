// components/MatchHistoryCard.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../hooks/useTheme';
import { Match } from '../types';

interface MatchHistoryCardProps {
  match: Match;
  darkMode: boolean;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ match, darkMode }) => {
  const theme = useTheme(darkMode);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {match.teams.map((team, index) => {
        const isWinner = index === match.winnerTeamIndex;
        return (
          <View key={index} style={styles.teamRow}>
            <Text style={[styles.teamText, { color: theme.text, fontWeight: isWinner ? 'bold' : 'normal' }]}>
              <Text style={{ color: theme.primary }}>Time {index + 1}: </Text>
              {team.names.join(', ')}
              {isWinner && ' (🏆 Vencedor)'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  teamRow: {
    marginBottom: 4,
  },
  teamText: {
    fontSize: 15,
  },
});

export default MatchHistoryCard;