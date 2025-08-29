import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import HistoryDayCard from '../components/HistoryDayCard';
import HistoryFilterModal, { HistoryFilter } from '../components/HistoryFilterModal';
import MatchDetailCard from '../components/MatchDetailCard';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';
import { Match } from '../types';
import { filterMatchHistory, getFilterStats, hasActiveFilters } from '../utils/historyFilterUtils';

// Filter Icon SVG
const FilterIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// Clear filters icon
const ClearIcon = ({ color = 'white', size = 16 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { matchHistory, deleteMatchesByDate, deleteMatch } = useGameStore();
  const { allPlayers } = usePlayersStore();
  const { darkMode } = useThemeStore();
  const theme = useTheme(darkMode);

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Filter state
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilter[]>([]);

  // Apply filters to match history
  const filteredMatchHistory = useMemo(() => {
    return filterMatchHistory(matchHistory, historyFilters);
  }, [matchHistory, historyFilters]);

  const historySections = useMemo(() => {
    const grouped = filteredMatchHistory.reduce((acc, match) => {
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
  }, [filteredMatchHistory]);

  // Filter statistics
  const filterStats = getFilterStats(matchHistory.length, filteredMatchHistory.length, historyFilters);
  const hasFilters = hasActiveFilters(historyFilters);

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

  const handleOpenFilter = () => {
    setIsFilterModalVisible(true);
  };

  const handleCloseFilter = () => {
    setIsFilterModalVisible(false);
  };

  const handleFiltersChange = (newFilters: HistoryFilter[]) => {
    setHistoryFilters(newFilters);
  };

  const clearFilters = () => {
    setHistoryFilters([]);
  };

  const matchesForSelectedDate = useMemo(() => {
    return historySections.find(s => s.title === selectedDate)?.data || [];
  }, [historySections, selectedDate]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 8, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
      {selectedDate === null ? (
        <>
          {/* Header with search and filter */}
          <View style={styles.headerContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.inputArea, color: theme.text, borderColor: theme.inputArea }]}
              placeholder="Buscar por data..."
              placeholderTextColor={theme.placeholder}
              value={historySearchQuery}
              onChangeText={setHistorySearchQuery}
            />
            
            <TouchableOpacity
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: hasFilters ? theme.primary : theme.cardInactive,
                  borderColor: hasFilters ? theme.primary : theme.cardInactive
                }
              ]}
              onPress={handleOpenFilter}
              activeOpacity={0.7}
            >
              <FilterIcon color={hasFilters ? theme.primaryText : theme.placeholder} size={18} />
              {hasFilters && (
                <View style={[styles.filterBadge, { backgroundColor: theme.primaryText }]}>
                  <Text style={[styles.filterBadgeText, { color: theme.primary }]}>
                    {filterStats.filtersApplied}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Status */}
          {hasFilters && (
            <View style={[styles.filterStatus, { backgroundColor: theme.card }]}>
              <View style={styles.filterStatusLeft}>
                <Text style={[styles.filterStatusText, { color: theme.text }]}>
                  {filteredMatchHistory.length} de {matchHistory.length} partidas
                </Text>
                <Text style={[styles.filterStatusSubtext, { color: theme.placeholder }]}>
                  {filterStats.filtersApplied} filtro{filterStats.filtersApplied !== 1 ? 's' : ''} aplicado{filterStats.filtersApplied !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.clearFiltersButton, { backgroundColor: theme.danger + '20' }]}
                onPress={clearFilters}
              >
                <ClearIcon color={theme.danger} size={14} />
                <Text style={[styles.clearFiltersText, { color: theme.danger }]}>
                  Limpar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* History list */}
          {historySections.length === 0 ? (
            <View style={styles.emptyContainer}>
              {hasFilters ? (
                <>
                  <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
                    Nenhuma partida encontrada com os filtros aplicados.
                  </Text>
                  <TouchableOpacity
                    style={[styles.clearFiltersButtonLarge, { backgroundColor: theme.primary }]}
                    onPress={clearFilters}
                  >
                    <Text style={[styles.clearFiltersButtonText, { color: theme.primaryText }]}>
                      Limpar Filtros
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
                  Nenhuma partida foi salva ainda.
                </Text>
              )}
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
            {hasFilters && (
              <Text style={[styles.dateFilterNote, { color: theme.placeholder }]}>
                (com filtros)
              </Text>
            )}
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

      {/* Filter Modal */}
      <HistoryFilterModal
        visible={isFilterModalVisible}
        darkMode={darkMode}
        players={allPlayers}
        filters={historyFilters}
        onClose={handleCloseFilter}
        onFiltersChange={handleFiltersChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterStatusLeft: {
    flex: 1,
  },
  filterStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterStatusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearFiltersButtonLarge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 4, textAlign: 'center' },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: { fontSize: 18, fontWeight: "700" },
  dateFilterNote: {
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});