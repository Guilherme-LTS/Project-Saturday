import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import useTheme from '../hooks/useTheme';
import { usePlayersStore } from '../stores/playersStore';
import DraggablePlayer from './DraggablePlayer';
import PlayerAvatar from './PlayerAvatar';
import { Player } from '../types';

interface ReservesAreaProps {
  leftoverPlayerIds: string[];
  darkMode: boolean;
}

const ReservesArea: React.FC<ReservesAreaProps> = ({ leftoverPlayerIds, darkMode }) => {
  const theme = useTheme(darkMode);
  const { allPlayers } = usePlayersStore();

  const reservePlayers = leftoverPlayerIds
    .map(id => allPlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  if (reservePlayers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.placeholder }]}>Reservas ({reservePlayers.length})</Text>
      <ScrollView 
        horizontal={false}
        nestedScrollEnabled={true}
        style={[styles.reservesContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
        contentContainerStyle={styles.reservesContent}
      >
        {reservePlayers.map(player => (
          <DraggablePlayer
            key={player.id}
            teamIndex={-1}
            playerId={player.id}
            style={styles.playerWrapper}
          >
            <View style={{ alignItems: 'center' }}>
              <PlayerAvatar player={player} size={36} theme={theme} />
              <Text numberOfLines={1} style={[styles.playerName, { color: theme.text }]}>
                {player.name.split(' ')[0]}
              </Text>
            </View>
          </DraggablePlayer>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  reservesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 140, // Prevents overflow when there are many reserves
  },
  reservesContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
    justifyContent: 'center',
    minHeight: 64,
  },
  playerWrapper: {
    alignItems: 'center',
    width: 52,
  },
  playerName: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ReservesArea;
