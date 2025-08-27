import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import HistoryDayCard from '../components/HistoryDayCard';
import MatchDetailCard from '../components/MatchDetailCard';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { useThemeStore } from '../stores/themeStore';
import { Match } from '../types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { matchHistory, deleteMatchesByDate, deleteMatch } = useGameStore();
  const { darkMode } = useThemeStore();
  const theme = useTheme(darkMode);

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const historySections = useMemo(() => {
    const grouped = matchHistory.reduce((acc, match) => {
      // Use the short format as the key for grouping
      const shortDate = new Date(match.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      if (!acc[shortDate]) acc[shortDate] = [];
      acc[shortDate].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    // Create the final sections array, now including both date formats for searching
    return Object.entries(grouped).map(([shortDate, matches]) => {
      // Generate the long date format from the first match of the day
      const longDate = new Date(matches[0].date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      return {
        title: shortDate, // This is what's displayed (e.g., "26/08/25")
        longDate: longDate, // This is also used for searching (e.g., "26 de agosto de 2025")
        data: matches,
      };
    });
  }, [matchHistory]);

  // --- Handlers ---

  const handleDeleteDay = (dateTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      `Apagar partidas de ${dateTitle}?`,
      "Esta ação é permanente.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Apagar", style: "destructive", onPress: () => deleteMatchesByDate(dateTitle) },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteMatch = (matchId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Apagar esta partida?", "Esta ação não pode ser desfeita.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: () => deleteMatch(matchId) },
      ],
      { cancelable: true }
    );
  };

  const matchesForSelectedDate = useMemo(() => {
    return historySections.find(s => s.title === selectedDate)?.data || [];
  }, [historySections, selectedDate]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 8 }]}>
      {selectedDate === null ? (
        <>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.cardInactive, color: theme.text, borderColor: theme.cardInactive, marginBottom: 16 }]}
            placeholder="Buscar por data..."
            placeholderTextColor={theme.placeholder}
            value={historySearchQuery}
            onChangeText={setHistorySearchQuery}
          />
          {historySections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>Nenhuma partida foi salva ainda.</Text>
            </View>
          ) : (
            <FlatList
              data={historySections
                .filter(section => {
                  const query = historySearchQuery.toLowerCase();
                  return section.title.toLowerCase().includes(query) || section.longDate.toLowerCase().includes(query);
                })
                .slice()
              }
              keyExtractor={(item) => item.title}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <HistoryDayCard
                  date={item.title}
                  matchCount={item.data.length}
                  onPress={() => setSelectedDate(item.title)}
                  onLongPress={() => handleDeleteDay(item.title)}
                  darkMode={darkMode}
                />
              )}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              onPress={() => setSelectedDate(null)}
              style={{ padding: 4 }}
            >
              <ArrowLeftIcon stroke={theme.text} width={26} height={26} />
            </TouchableOpacity>
            <Text style={[styles.heading, { color: theme.text, marginLeft: 10 }]}>
              {selectedDate}
            </Text>
          </View>
          <FlatList
            data={matchesForSelectedDate.slice()}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <MatchDetailCard
                match={item}
                matchNumber={matchesForSelectedDate.length - index}
                darkMode={darkMode}
                onDelete={handleDeleteMatch}
                animationSpeed={100}
              />
            )}
            contentContainerStyle={{ paddingTop: 16 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 4, textAlign: 'center' },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: { fontSize: 18, fontWeight: "700" },
});
