import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Team } from '../types'; // Verifique se está importando de '../types'

interface TeamCardProps {
  team: Team;
  teamNumber: number;
  darkMode: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, teamNumber, darkMode }) => {
  return (
    <View
      style={[
        styles.teamCard,
        {
          backgroundColor: darkMode ? '#333' : '#fff',
          borderColor: darkMode ? '#555' : '#eee',
        },
      ]}
    >
      <Text style={[styles.teamTitle, { color: darkMode ? '#0a84ff' : '#0a84ff' }]}>
        Time {teamNumber} ({team.names.length}) - Peso total: {team.total}
      </Text>
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
    borderWidth: 1,
  },
  teamTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  teamPlayer: {
    fontSize: 15,
    marginLeft: 8,
    marginBottom: 2,
  },
});

export default TeamCard;