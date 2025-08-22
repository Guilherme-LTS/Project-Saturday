import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Player } from '../types'; // Descomente quando criarmos o arquivo de types

// 1. Definindo as propriedades que o componente espera receber
interface PlayerCardProps {
  player: Player;
  darkMode: boolean;
  onToggleActive: (id: string) => void;
  onLongPress: (player: Player) => void;
}

const cardMargin = 8; // Constante necessária para o estilo do card

// 2. O componente em si, recebendo as props
const PlayerCard: React.FC<PlayerCardProps> = ({ player, darkMode, onToggleActive, onLongPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.playerCard,
        { backgroundColor: darkMode ? '#333' : '#fff' },
        !player.active && { backgroundColor: darkMode ? '#141414ff' : '#f0f0f0' },
      ]}
      onPress={() => onToggleActive(player.id)}
      onLongPress={() => onLongPress(player)}
    >
      <Text
        style={[
          styles.playerName,
          { color: darkMode ? '#fff' : '#222' },
          !player.active && styles.playerNameInactive,
        ]}
      >
        {player.name}
      </Text>
    </TouchableOpacity>
  );
};

// 3. Estilos que pertencem apenas a este componente
const styles = StyleSheet.create({
  playerCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: cardMargin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerNameInactive: {
    fontSize: 12,
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
});

// 4. Exportando o componente para que outros arquivos possam usá-lo
export default PlayerCard;