import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import ArrowRightIcon from '../assets/icons/arrow-right.svg'; // Vamos usar um ícone de seta
import useTheme from '../hooks/useTheme';

interface HistoryDayCardProps {
  date: string;
  matchCount: number;
  onPress: () => void;
  onLongPress: () => void;
  darkMode: boolean;
}

const HistoryDayCard: React.FC<HistoryDayCardProps> = ({ date, matchCount, onPress, onLongPress, darkMode }) => {
  const theme = useTheme(darkMode);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.dateText, { color: theme.text }]}>{date}</Text>
      <Text style={[styles.countText, { color: theme.placeholder }]}>
        {matchCount} {matchCount === 1 ? 'partida' : 'partidas'}
      </Text>
      <ArrowRightIcon stroke={theme.placeholder} width={24} height={24} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1, // Garante que o texto ocupe o espaço
  },
  countText: {
    fontSize: 14,
    marginRight: 12,
  },
});

export default HistoryDayCard;