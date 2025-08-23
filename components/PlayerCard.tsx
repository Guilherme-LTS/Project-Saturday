// components/PlayerCard.tsx (versão com peso do jogador)

import Checkbox from 'expo-checkbox';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  darkMode: boolean;
  onToggleActive: (id: string) => void;
  onLongPress: (player: Player) => void;
  variant: 'grid' | 'list';
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (playerId: string) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  darkMode,
  onToggleActive,
  onLongPress,
  variant,
  selectable,
  isSelected,
  onSelect,
}) => {
  
  const handlePress = () => {
    if (selectable && onSelect) {
      onSelect(player.id);
    } else {
      onToggleActive(player.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.playerCardBase,
        variant === 'grid' ? styles.playerCardGrid : styles.playerCardList,
        { backgroundColor: darkMode ? '#333' : '#fff' },
        !player.active && !selectable && { backgroundColor: darkMode ? '#141414ff' : '#f0f0f0' },
      ]}
      onPress={handlePress}
      onLongPress={() => onLongPress(player)}
    >
      <View style={[styles.contentContainer, variant === 'grid' && styles.contentContainerGrid]}>
        {variant === 'list' && (
          <View style={[styles.weightContainer, { backgroundColor: darkMode ? '#555' : '#eee' }]}>
            <Text style={[styles.weightText, { color: darkMode ? '#fff' : '#222' }]}>
              {player.weight}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.playerName,
            { color: darkMode ? '#fff' : '#222' },
            !player.active && !selectable && styles.playerNameInactive,
          ]}
          numberOfLines={1} // Garante que nomes longos não quebrem a linha
        >
          {player.name}
        </Text>
        {selectable && (
          <Checkbox
            style={styles.checkbox}
            value={isSelected}
            onValueChange={() => onSelect && onSelect(player.id)}
            color={isSelected ? '#0a84ff' : (darkMode ? '#fff' : '#222')}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  playerCardBase: {
    borderRadius: 8,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 2,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  playerNameInactive: {
    fontSize: 12,
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  playerCardGrid: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  contentContainerGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  playerCardList: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  weightContainer: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 16,
  },
  weightText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PlayerCard;