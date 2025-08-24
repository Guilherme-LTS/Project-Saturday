// components/CourtView.tsx (versão com avatares dinâmicos)

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import useTheme from '../hooks/useTheme';
import { Team } from '../types';

interface CourtViewProps {
  teams: Team[];
  darkMode: boolean;
  winnerIndex: number | null;
  onSelectWinner: (index: number) => void;
}

const CourtView: React.FC<CourtViewProps> = ({ teams, darkMode, winnerIndex, onSelectWinner }) => {
  const theme = useTheme(darkMode);
  
  const team1 = teams[0]?.players || [];
  const team2 = teams[1]?.players || [];

  // --- NOVA LÓGICA DE ESTILO DINÂMICO ---
  // Verifica se cada time é "grande" (10 ou mais jogadores)
  const isTeam1Large = team1.length >= 10;
  const isTeam2Large = team2.length >= 10;

  // Define os estilos para o Time 1 com base no tamanho
  const team1PlayerContainerStyle: ViewStyle = { width: isTeam1Large ? '23%' : '30%' };
  const team1AvatarStyle = { 
    width: isTeam1Large ? 40 : 50, 
    height: isTeam1Large ? 40 : 50,
    borderRadius: isTeam1Large ? 20 : 25,
  };

  // Define os estilos para o Time 2 com base no tamanho
  const team2PlayerContainerStyle: ViewStyle = { width: isTeam2Large ? '23%' : '30%' };
  const team2AvatarStyle = { 
    width: isTeam2Large ? 40 : 50, 
    height: isTeam2Large ? 40 : 50,
    borderRadius: isTeam2Large ? 20 : 25,
  };


  return (
    <View style={[styles.court, { backgroundColor: theme.card, borderColor: theme.border }]}>
      
      {/* Time 1 (em cima) */}
      <TouchableOpacity
        style={[ styles.teamArea, {
          borderColor: winnerIndex === 0 ? theme.accentGreen : 'transparent',
          borderBottomLeftRadius: winnerIndex === 0 ? 0 : styles.teamArea.borderRadius,
          borderBottomRightRadius: winnerIndex === 0 ? 0 : styles.teamArea.borderRadius,
        }]} 
        onPress={() => onSelectWinner(0)}
      >
        {team1.map(player => (
          <View key={player.id} style={[styles.playerContainer, team1PlayerContainerStyle]}>
            <Image
              source={player.photoUri ? { uri: player.photoUri } : require('../assets/images/default-avatar.png')}
              style={[styles.avatarBase, { borderColor: theme.border }, team1AvatarStyle]}
            />
            <Text numberOfLines={1} style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
          </View>
        ))}
      </TouchableOpacity>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Time 2 (em baixo) */}
      <TouchableOpacity
        style={[ styles.teamArea, {
          borderColor: winnerIndex === 1 ? theme.accentGreen : 'transparent',
          borderTopLeftRadius: winnerIndex === 1 ? 0 : styles.teamArea.borderRadius,
          borderTopRightRadius: winnerIndex === 1 ? 0 : styles.teamArea.borderRadius,
        }]}
        onPress={() => onSelectWinner(1)}
      >
        {team2.map(player => (
          <View key={player.id} style={[styles.playerContainer, team2PlayerContainerStyle]}>
            <Image
              source={player.photoUri ? { uri: player.photoUri } : require('../assets/images/default-avatar.png')}
              style={[styles.avatarBase, { borderColor: theme.border }, team2AvatarStyle]}
            />
            <Text numberOfLines={1} style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
          </View>
        ))}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  court: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    marginVertical: 16,
    minHeight: 250,
  },
  teamArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  divider: {
    height: 2,
  },
  playerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  // Estilo base do avatar, sem tamanho
  avatarBase: {
    borderWidth: 1,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CourtView;