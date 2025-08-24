import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useTheme from '../hooks/useTheme';
import { Match } from '../types';

interface MatchHistoryCardProps {
  match: Match;
  darkMode: boolean;
  onDelete: (matchId: string) => void;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ match, darkMode, onDelete }) => {
  const theme = useTheme(darkMode);

  return (
    <TouchableOpacity onLongPress={() => onDelete(match.id)}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {match.teams.map((team, index) => {
          const isWinner = index === match.winnerTeamIndex;
          
          // LÓGICA CORRIGIDA: Verifica se existe 'team.players'. Se não, usa 'team.names'.
          const playerNames = team.players 
            ? team.players.map(p => p.name).join(', ') 
            : (team as any).names?.join(', ') || 'Jogadores não encontrados';

          return (
            <View key={index} style={styles.teamRow}>
              <Text style={[styles.teamText, { color: theme.text, fontWeight: isWinner ? 'bold' : 'normal' }]}>
                <Text style={{ color: theme.primary }}>Time {index + 1}: </Text>
                {playerNames}
                {isWinner && ' (🏆 Vencedor)'}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
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