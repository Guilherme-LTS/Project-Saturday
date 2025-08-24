import Checkbox from 'expo-checkbox';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Team } from '../types';

interface TeamCardProps {
  team: Team;
  teamNumber: number;
  darkMode: boolean;
  balanceMode: 'level' | 'winrate';
  showWinnerCheckbox?: boolean;
  isWinner?: boolean;
  onSelectWinner?: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  teamNumber,
  darkMode,
  balanceMode,
  showWinnerCheckbox,
  isWinner,
  onSelectWinner,
}) => {
  
  const averageValue =
    team.players.length > 0
      ? (team.total / team.players.length).toFixed(1)
      : 0;
  
  const label = balanceMode === 'level' ? 'Nível médio:' : 'Vitória média:';
  const displayValue = balanceMode === 'level' ? averageValue : `${averageValue}%`;

  return (
    <TouchableOpacity onPress={onSelectWinner} disabled={!showWinnerCheckbox}>
      <View
        style={[
          styles.teamCard,
          {
            backgroundColor: darkMode ? '#333' : '#fff',
            borderColor: isWinner ? '#4CAF50' : (darkMode ? '#555' : '#eee'),
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.teamTitle, { color: darkMode ? '#0a84ff' : '#0a84ff' }]}>
            Time {teamNumber} ({team.players.length}) - {label} {displayValue}
          </Text>
          {showWinnerCheckbox && (
            <Checkbox
              value={isWinner}
              onValueChange={onSelectWinner}
              color={isWinner ? '#4CAF50' : '#888'}
            />
          )}
        </View>
        {team.players.map((player) => (
          <Text key={player.id} style={[styles.teamPlayer, { color: darkMode ? '#fff' : '#222' }]}>
            • {player.name}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  teamCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamTitle: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  teamPlayer: {
    fontSize: 15,
    marginLeft: 8,
    marginBottom: 2,
  },
});

export default TeamCard;