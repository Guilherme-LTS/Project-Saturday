// components/TeamCard.tsx (versão final e corrigida)

import Checkbox from 'expo-checkbox';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const TeamCard: React.FC<TeamCardProps> = ({ team, teamNumber, darkMode, balanceMode, showWinnerCheckbox, isWinner, onSelectWinner }) => {
  
  const averageValue =
    team.names.length > 0
      ? (team.total / team.names.length).toFixed(1)
      : 0;
  
  // A lógica aqui já estava correta
  const label = balanceMode === 'level' ? 'Nível médio:' : 'Vitória média:';
  const displayValue = balanceMode === 'level' ? averageValue : `${averageValue}%`;

  return (
    <View
      style={[
        styles.teamCard,
        {
          backgroundColor: darkMode ? '#333' : '#fff',
          borderColor: darkMode ? (isWinner ? '#4CAF50' : '#555') : (isWinner ? '#4CAF50' : '#eee'),
          borderWidth: isWinner ? 2 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.teamTitle, { color: darkMode ? '#0a84ff' : '#0a84ff' }]}>
          Time {teamNumber} ({team.names.length}) - {label} {displayValue}
        </Text>
        {showWinnerCheckbox && (
          <Checkbox
            value={isWinner}
            onValueChange={onSelectWinner}
            color={isWinner ? '#4CAF50' : '#888'}
          />
        )}
      </View>
      {team.names.map((name, i) => (
        <Text key={i} style={[styles.teamPlayer, { color: darkMode ? '#fff' : '#222' }]}>
          • {name}
        </Text>
      ))}
    </View>
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