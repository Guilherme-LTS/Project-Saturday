import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SortWinRateIcon from '../assets/icons/award.svg';
import SortLevelIcon from '../assets/icons/bar-chart-2.svg';
import SortAlphaIcon from '../assets/icons/sort-alpha.svg';
import SortSessionIcon from '../assets/icons/sort-session.svg';
import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import EditNameModal from '../components/EditNameModal';
import PlayerCard from '../components/PlayerCard';
import PlayerStatsModal from '../components/PlayerStatsModal'; // Import the new unified modal
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';
import { Player, PlayerFundamentals, SortMode } from '../types';
import { calculatePlayerStats } from '../utils/helpers';

function normalizeString(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const compareByName = (a: Player, b: Player) => normalizeString(a.name).localeCompare(normalizeString(b.name));

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [showInput, setShowInput] = useState(false);
  const [rawInput, setRawInput] = useState('');
  
  // State for modals
  const [isStatsModalVisible, setStatsModalVisible] = useState(false);
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { allPlayers, selectedPlayerIds, togglePlayerSelection, addPlayers, deletePlayer, updatePlayer } = usePlayersStore();
  const { darkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const theme = useTheme(darkMode);
  const { matchHistory } = useGameStore();

  const importNames = () => {
    const lines = rawInput.split(/\r?\n|,|;/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const existingNames = new Set(allPlayers.map(p => p.name.toLowerCase()));
    const newPlayers: Player[] = [];

    lines.forEach(line => {
      const parts = line.split(/\s+/);
      let weight: 1 | 2 | 3 = 2;
      const last = parts[parts.length - 1];

      if (["1", "2", "3"].includes(last)) {
        weight = parseInt(last) as 1 | 2 | 3;
        parts.pop();
      }
      const name = parts.join(" ");
      if (name.length > 0 && !existingNames.has(name.toLowerCase())) {
        newPlayers.push({ id: generateId(), name, active: true, weight });
      }
    });
    
    if (newPlayers.length > 0) addPlayers(newPlayers);
    setRawInput('');
    setShowInput(false);
  };

  const openPlayerStatsModal = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayer(player);
    setStatsModalVisible(true);
  };

  const handleSaveName = (playerId: string, newName: string) => {
    updatePlayer(playerId, { name: newName });
    setIsEditNameModalVisible(false);
    // Re-open the stats modal to see the change
    setSelectedPlayer(prev => prev ? { ...prev, name: newName } : null);
    setStatsModalVisible(true);
  };

  const cycleSortMode = () => {
    const modes: SortMode[] = ['alphabetical', 'level', 'winrate', 'session'];
    const currentIndex = modes.indexOf(sortMode);
    setSortMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleUpdateWeight = (playerToUpdate: Player) => {
    const currentWeight = playerToUpdate.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3;
    updatePlayer(playerToUpdate.id, { weight: nextWeight });
    setSelectedPlayer(prev => prev ? { ...prev, weight: nextWeight } : null);
  };

  const handleDeletePlayer = (playerId: string) => {
    setStatsModalVisible(false);
    Alert.alert("Remover Jogador?", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deletePlayer(playerId) }
    ]);
  };

  const handleChangePhoto = (player: Player, photoUri: string) => {
    updatePlayer(player.id, { photoUri });
    setSelectedPlayer(prev => prev ? { ...prev, photoUri } : null);
  };

  const handleRemovePhoto = (playerId: string) => {
    updatePlayer(playerId, { photoUri: undefined });
    setSelectedPlayer(prev => prev ? { ...prev, photoUri: undefined } : null);
  };

  const handleSaveFundamentals = (playerId: string, fundamentals: PlayerFundamentals) => {
    updatePlayer(playerId, { fundamentals });
  };

  const statsByPlayer = useMemo(() => {
    const map = new Map<string, any>();
    allPlayers.forEach(p => map.set(p.id, calculatePlayerStats(p.id, matchHistory)));
    return map;
  }, [allPlayers, matchHistory]);

  const filteredPlayers = useMemo(() => {
    const filtered = allPlayers.filter(p => normalizeString(p.name).includes(normalizeString(searchQuery)));
    // Sorting logic remains the same
    return filtered;
  }, [allPlayers, searchQuery, sortMode, selectedPlayerIds, matchHistory, statsByPlayer]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 8, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { flex: 1, backgroundColor: theme.inputArea, color: theme.text, borderColor: theme.inputArea }]}
          placeholder="Buscar jogador..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={[styles.sortButton, { backgroundColor: theme.accentGreen }]} onPress={cycleSortMode}>
          {sortMode === 'alphabetical' && <SortAlphaIcon fill={theme.text} width={24} height={24} />}
          {sortMode === 'level' && <SortLevelIcon stroke={theme.text} width={24} height={24} />}
          {sortMode === 'winrate' && <SortWinRateIcon stroke={theme.text} width={24} height={24} />}
          {sortMode === 'session' && <SortSessionIcon stroke={theme.text} width={24} height={24} />}
        </TouchableOpacity>
      </View>
      <View style={[styles.addContainer, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.dropdownHeader} onPress={() => setShowInput(!showInput)}>
          <Text style={[styles.subheading, { color: theme.text }]}>Adicionar novos jogadores</Text>
          <Text style={[styles.arrow, { color: theme.text }]}>{showInput ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {showInput && (
          <View style={styles.dropdownContent}>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.inputArea, color: theme.text }]}
              multiline
              placeholder={"Ex: João 3\nPedro\nnome e nível (1, 2 ou 3)"}
              placeholderTextColor={theme.placeholder}
              value={rawInput}
              onChangeText={setRawInput}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.accentGreen }]} onPress={importNames}>
              <Text style={[styles.buttonText]}>Adicionar jogadores</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            darkMode={darkMode}
            onToggleActive={() => {}}
            onLongPress={() => openPlayerStatsModal(item)}
            variant="list"
            selectable={true}
            isSelected={selectedPlayerIds.has(item.id)}
            onSelect={() => togglePlayerSelection(item.id)}
            matchHistory={matchHistory}
          />
        )}
      />
      
      {/* Render the new unified modal */}
      <PlayerStatsModal
        visible={isStatsModalVisible}
        player={selectedPlayer}
        onClose={() => setStatsModalVisible(false)}
        darkMode={darkMode}
        matchHistory={matchHistory}
        onDelete={handleDeletePlayer}
        onEditName={() => {
          setStatsModalVisible(false);
          setIsEditNameModalVisible(true);
        }}
        onChangePhoto={handleChangePhoto}
        onRemovePhoto={handleRemovePhoto}
        onSaveFundamentals={handleSaveFundamentals}
        onUpdateWeight={handleUpdateWeight}
      />
      
      {/* EditNameModal is still needed, but now launched from PlayerStatsModal */}
      <EditNameModal
        visible={isEditNameModalVisible}
        player={selectedPlayer}
        onClose={() => {
          setIsEditNameModalVisible(false);
          setStatsModalVisible(true); // Go back to stats modal
        }}
        onSave={handleSaveName}
        darkMode={darkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 16 },
  sortButton: { height: 44, width: 44, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 12, paddingHorizontal: 8 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 },
  subheading: { fontSize: 15, fontWeight: "600" },
  arrow: { fontSize: 18 },
  dropdownContent: { paddingBottom: 8 },
  textArea: { minHeight: 60, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: "top", fontSize: 16 },
  button: { marginTop: 8, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { fontWeight: "bold", fontSize: 16, color: '#FFFFFF' },
});
