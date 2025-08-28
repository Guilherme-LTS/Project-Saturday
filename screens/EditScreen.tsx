import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component Imports
import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import EditNameModal from '../components/EditNameModal';
import PlayerCard from '../components/PlayerCard';
import PlayerFundamentalsModal from '../components/PlayerFundamentalsModal';
import PlayerOptionsModal from '../components/PlayerOptionsModal';
import TeamSizeSlider from '../components/TeamSizeSlider';

// Hook and Store Imports
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';
import { Player, PlayerFundamentals } from '../types';

export default function EditScreen() {
  // --- Hooks ---
  const insets = useSafeAreaInsets();
  const { allPlayers, selectedPlayerIds, togglePlayerActive, deletePlayer, updatePlayer } = usePlayersStore();
  const { teamSize, setTeamSize, matchHistory } = useGameStore();
  const { darkMode } = useThemeStore();
  const theme = useTheme(darkMode);

  // --- UI State ---
  const [fadeHeight, setFadeHeight] = useState(60);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isFundamentalsModalVisible, setIsFundamentalsModalVisible] = useState(false);

  // --- Memoized Values ---
  const sessionPlayers = useMemo(
    () => allPlayers.filter(p => selectedPlayerIds.has(p.id)),
    [allPlayers, selectedPlayerIds]
  );

  const activeCount = useMemo(
    () => sessionPlayers.filter((p) => p.active).length,
    [sessionPlayers]
  );
  
  // Gets the most up-to-date player data from the store
  const selectedPlayer = useMemo(
    () => allPlayers.find(p => p.id === selectedPlayerId) || null,
    [allPlayers, selectedPlayerId]
  );

  // --- Modal and Action Handlers ---
  const openPlayerOptionsModal = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerId(player.id);
    setIsOptionsModalVisible(true);
  };

  const closePlayerOptionsModal = () => {
    setIsOptionsModalVisible(false);
    setSelectedPlayerId(null);
  };
  
  const handleSaveName = (playerId: string, newName: string) => {
    updatePlayer(playerId, { name: newName });
    setIsEditNameModalVisible(false);
    setSelectedPlayerId(null);
  };

  const handleEditName = () => {
    setIsOptionsModalVisible(false);
    setIsEditNameModalVisible(true);
  };

  const handleUpdateWeight = (playerToUpdate: Player) => {
    const currentWeight = playerToUpdate.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3;
    updatePlayer(playerToUpdate.id, { weight: nextWeight });
  };

  const handleDeletePlayer = (playerId: string) => {
    deletePlayer(playerId);
    closePlayerOptionsModal();
  };
  
  const handleChangePhoto = async (player: Player, photoUri: string) => {
    updatePlayer(player.id, { photoUri });
  };

  const handleRemovePhoto = (playerId: string) => {
    updatePlayer(playerId, { photoUri: undefined });
  };

  const handleEditFundamentals = () => {
    setIsOptionsModalVisible(false); // Close the options modal
    setIsFundamentalsModalVisible(true); // Open the fundamentals modal
  };

  const handleSaveFundamentals = (playerId: string, fundamentals: PlayerFundamentals) => {
    updatePlayer(playerId, { fundamentals }); // Update the player in the store
    setIsFundamentalsModalVisible(false); // Close the modal
    setIsOptionsModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
      {sessionPlayers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
            Nenhum jogador selecionado.
          </Text>
          <Text style={[styles.hint, { color: theme.placeholder }]}>
            Vá para a tela 'Jogadores' para escolher quem vai jogar.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, marginTop: 8 }}>
          <FlatList
            data={
              [...sessionPlayers].sort((a, b) => {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
                return a.name.localeCompare(b.name);
              })
            }
            keyExtractor={(item) => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PlayerCard
                player={item}
                darkMode={darkMode}
                onToggleActive={() => togglePlayerActive(item.id)}
                onLongPress={() => openPlayerOptionsModal(item)}
                variant="grid"
                matchHistory={matchHistory}
              />
            )}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            columnWrapperStyle={{ gap: 0.5 }}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const maxFadeHeight = 60;
              const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
              setFadeHeight(Math.max(30, Math.min(maxFadeHeight, distanceFromBottom)));
            }}
            scrollEventThrottle={16}
          />
          <LinearGradient
            colors={[theme.background, `${theme.background}00`]}
            style={styles.topFadeEffect}
            pointerEvents="none"
          />
          {fadeHeight > 0 && (
            <LinearGradient
              colors={[`${theme.background}00`, theme.background]}
              style={[styles.fadeEffect, { height: fadeHeight }]}
              pointerEvents="none"
            />
          )}
        </View>
      )}
      <View style={styles.editFooter}>
        <TeamSizeSlider
          value={teamSize}
          onValueChange={setTeamSize}
          darkMode={darkMode}
        />
        <Text style={[styles.hint, { color: theme.placeholder, textAlign: 'center' }]}>
          Jogadores ativos: {activeCount}
        </Text>
      </View>

      <PlayerOptionsModal
        visible={isOptionsModalVisible}
        player={selectedPlayer}
        onClose={closePlayerOptionsModal}
        darkMode={darkMode}
        matchHistory={matchHistory}
        onDelete={handleDeletePlayer}
        onEditName={handleEditName}
        onChangePhoto={handleChangePhoto}
        onRemovePhoto={handleRemovePhoto}
        onEditFundamentals={handleEditFundamentals}
        onUpdateWeight={handleUpdateWeight}
      />

      <EditNameModal
        visible={isEditNameModalVisible}
        player={selectedPlayer}
        onClose={() => {
          setIsEditNameModalVisible(false);
          setSelectedPlayerId(null);
        }}
        onSave={handleSaveName}
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
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hint: { fontSize: 12, marginTop: 4, marginBottom: 4, textAlign: 'center' },
    editFooter: { paddingTop: 8, paddingBottom: 8 },
    fadeEffect: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    topFadeEffect: { position: 'absolute', left: 0, right: 0, top: 0, height: 15 },
});