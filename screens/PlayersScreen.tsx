// src/screens/PlayersScreen.tsx
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../stores/gameStore';

// Corrected import name
import SortWinRateIcon from '../assets/icons/award.svg';
import SortLevelIcon from '../assets/icons/bar-chart-2.svg';
import SortAlphaIcon from '../assets/icons/sort-alpha.svg';
import SortSessionIcon from '../assets/icons/sort-session.svg';
import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import EditNameModal from '../components/EditNameModal';
import PlayerCard from '../components/PlayerCard';
import PlayerFundamentalsModal from '../components/PlayerFundamentalsModal';
import PlayerOptionsModal from '../components/PlayerOptionsModal';
import useTheme from '../hooks/useTheme';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';
import { Player, PlayerFundamentals, SortMode } from '../types';
import { calculatePlayerStats } from '../utils/helpers';

// This function was in your original index.tsx, but not exported from helpers.
// For now, it can live here. Ideally, you would export it from utils/helpers.ts
function normalizeString(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Helper to generate unique IDs for new players
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const compareByName = (a: Player, b: Player) =>
  normalizeString(a.name).localeCompare(normalizeString(b.name));

export default function PlayersScreen() {
  // Component state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [showInput, setShowInput] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [isFundamentalsModalVisible, setIsFundamentalsModalVisible] = useState(false);
  
  // Zustand store state and actions
  const { allPlayers, selectedPlayerIds, togglePlayerSelection, addPlayers, deletePlayer, updatePlayer } = usePlayersStore();
  const { darkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const theme = useTheme(darkMode);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { matchHistory } = useGameStore();

  // Corrected function to parse the raw input before adding players
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
        const newPlayer: Player = { id: generateId(), name, active: true, weight };
        newPlayers.push(newPlayer);
      }
    });
    
    if (newPlayers.length > 0) {
      addPlayers(newPlayers); // Pass the array of Player objects
    }

    setRawInput('');
    setShowInput(false);
  };

  const selectedPlayer = useMemo(
    () => allPlayers.find(p => p.id === selectedPlayerId) || null,
    [allPlayers, selectedPlayerId]
  );

  const handleSaveName = (playerId: string, newName: string) => { //
    updatePlayer(playerId, { name: newName });
    setIsEditNameModalVisible(false);
    setSelectedPlayerId(null); // Clear the ID after saving
  };

  const cycleSortMode = () => {
    const modes: SortMode[] = ['alphabetical', 'level', 'winrate', 'session'];
    const currentIndex = modes.indexOf(sortMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSortMode(modes[nextIndex]);
  };

  const openPlayerOptionsModal = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerId(player.id); // Set the ID
    setIsOptionsModalVisible(true);
    console.log('Opening options for:', player.name);
  };

  const closePlayerOptionsModal = () => {
    setIsOptionsModalVisible(false);
    setSelectedPlayerId(null); // Clear the ID
  };

  const handleEditFundamentals = () => {
    setIsOptionsModalVisible(false); // Close options modal
    setIsFundamentalsModalVisible(true); // Open fundamentals modal
  };

  const handleSaveFundamentals = (playerId: string, fundamentals: PlayerFundamentals) => {
    updatePlayer(playerId, { fundamentals });
    setIsFundamentalsModalVisible(false);
    setIsOptionsModalVisible(true);
  };

  const handleEditName = () => {
    setIsOptionsModalVisible(false); // Close the options modal
    setIsEditNameModalVisible(true);  // Open the edit name modal
  };

  const handleUpdateWeight = (playerToUpdate: Player) => { //
    const currentWeight = playerToUpdate.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3; // Cycles 1 -> 2 -> 3 -> 1
    updatePlayer(playerToUpdate.id, { weight: nextWeight });
  };

  const handleDeletePlayer = (playerId: string) => {
    closePlayerOptionsModal();
    Alert.alert("Remover Jogador?", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deletePlayer(playerId) }
    ]);
  };

  const handleChangePhoto = async (player: Player, photoUri: string) => {
      updatePlayer(player.id, { photoUri });
  };

  const handleRemovePhoto = (playerId: string) => {
    updatePlayer(playerId, { photoUri: undefined });
  };

  const statsByPlayer = useMemo(() => {
    const map = new Map<string, any>();
    allPlayers.forEach(p => {
      map.set(p.id, calculatePlayerStats(p.id, matchHistory));
    });
    return map;
  }, [allPlayers, matchHistory]);

  const filteredPlayers = useMemo(() => {
    const filteredBySearch = allPlayers.filter(p =>
      normalizeString(p.name).includes(normalizeString(searchQuery))
    );

    switch (sortMode) {
      case 'level':
        // Desc by weight; tie-break alphabetically
        return [...filteredBySearch].sort((a, b) => {
          if (b.weight !== a.weight) return b.weight - a.weight;
          return compareByName(a, b);
        });

      case 'winrate':
        // Desc by winRate; tie-break by gamesPlayed (desc), then name (asc)
        const getRate = (id: string) => {
          const r = statsByPlayer.get(id)?.winRate;
          return typeof r === 'number' ? r : -1; // push unknowns to bottom
        };
        const getGames = (id: string) =>
          statsByPlayer.get(id)?.gamesPlayed ?? -1;

        return [...filteredBySearch].sort((a, b) => {
          const rateA = getRate(a.id);
          const rateB = getRate(b.id);
          if (rateA !== rateB) return rateB - rateA;    // higher first
          const gamesA = getGames(a.id);
          const gamesB = getGames(b.id);
          if (gamesA !== gamesB) return gamesB - gamesA; // more games first
          return compareByName(a, b);
        });

      case 'session':
        // Selected first; tie-break alphabetically
        return [...filteredBySearch].sort((a, b) => {
          const aSel = selectedPlayerIds.has(a.id);
          const bSel = selectedPlayerIds.has(b.id);
          if (aSel !== bSel) return aSel ? -1 : 1;
          return compareByName(a, b);
        });

      case 'alphabetical':
      default:
        return [...filteredBySearch].sort(compareByName);
    }
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
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: theme.accentGreen, borderColor: theme.accentGreen }]}
          onPress={cycleSortMode}
        >
          {sortMode === 'alphabetical' && <SortAlphaIcon fill={theme.text} width={24} height={24} />}
          {sortMode === 'level' && <SortLevelIcon stroke={theme.text} width={24} height={24} />}
          {sortMode === 'winrate' && <SortWinRateIcon stroke={theme.text} width={24} height={24} />}
          {sortMode === 'session' && <SortSessionIcon stroke={theme.text} width={24} height={24} />}
        </TouchableOpacity>
      </View>
      <View style={[styles.addContainer, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setShowInput(!showInput)}
        >
          <Text style={[styles.subheading, { color: theme.text }]}>Adicionar novos jogadores</Text>
          <Text style={[styles.arrow, { color: theme.text }]}>{showInput ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {showInput && (
          <View style={styles.dropdownContent}>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.inputArea, color: theme.text, borderColor: theme.inputArea }]}
              multiline
              placeholder={"Ex: João 3\nPedro\nnome e nível (1, 2 ou 3)"}
              placeholderTextColor={theme.placeholder}
              value={rawInput}
              onChangeText={setRawInput}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accentGreen, marginTop: 8 }]}
              onPress={importNames}
            >
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>Adicionar jogadores</Text>
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
            onLongPress={() => openPlayerOptionsModal(item)}
            variant="list"
            selectable={true}
            isSelected={selectedPlayerIds.has(item.id)}
            onSelect={() => togglePlayerSelection(item.id)}
            matchHistory={matchHistory}
          />
        )}
      />
      <PlayerOptionsModal
        visible={isOptionsModalVisible}
        player={selectedPlayer}
        onClose={closePlayerOptionsModal}
        darkMode={darkMode}
        matchHistory={matchHistory}
        onDelete={handleDeletePlayer}
        onEditName={handleEditName}         // Now matches!
        onChangePhoto={handleChangePhoto}   // Added to prevent new errors
        onRemovePhoto={handleRemovePhoto}   // Added to prevent new errors
        onEditFundamentals={handleEditFundamentals}
        onUpdateWeight={handleUpdateWeight}

      />
      <EditNameModal
        visible={isEditNameModalVisible}
        player={selectedPlayer}
        onClose={() => {
          setIsEditNameModalVisible(false);
          setIsOptionsModalVisible(true);
        }}
        onSave={handleSaveName} // Now correctly finds this function
        darkMode={darkMode}
      />
      <PlayerFundamentalsModal
        visible={isFundamentalsModalVisible}
        player={selectedPlayer}
        onClose={() => {
          setIsFundamentalsModalVisible(false);
          setIsOptionsModalVisible(true);
        }}
        onSave={handleSaveFundamentals}
        darkMode={darkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  sortButton: {
    height: 44,
    width: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  subheading: { fontSize: 15, fontWeight: "600" },
  arrow: { fontSize: 18 },
  dropdownContent: {
    paddingBottom: 8,
  },
  textArea: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
