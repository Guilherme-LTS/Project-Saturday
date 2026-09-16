import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import EditNameModal from '../components/EditNameModal';
import PlayerCard from '../components/PlayerCard';
import PlayerStatsModal from '../components/PlayerStatsModal'; // Import the new unified modal
import TeamSizeSlider from '../components/TeamSizeSlider';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';
import { Player, PlayerFundamentals } from '../types';

export default function EditScreen() {
  const insets = useSafeAreaInsets();
  const { allPlayers, selectedPlayerIds, togglePlayerActive, deletePlayer, updatePlayer } = usePlayersStore();
  const { teamSize, setTeamSize, matchHistory } = useGameStore();
  const { darkMode } = useThemeStore();
  const theme = useTheme(darkMode);

  const [fadeHeight, setFadeHeight] = useState(60);
  
  // State for modals
  const [isStatsModalVisible, setStatsModalVisible] = useState(false);
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const sessionPlayers = useMemo(() => allPlayers.filter(p => selectedPlayerIds.has(p.id)), [allPlayers, selectedPlayerIds]);
  const activeCount = useMemo(() => sessionPlayers.filter((p) => p.active).length, [sessionPlayers]);

  const openPlayerStatsModal = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayer(player);
    setStatsModalVisible(true);
  };

  const handleSaveName = (playerId: string, newName: string) => {
    updatePlayer(playerId, { name: newName });
    setIsEditNameModalVisible(false);
    setSelectedPlayer(prev => prev ? { ...prev, name: newName } : null);
    setStatsModalVisible(true);
  };

  const handleUpdateWeight = (playerToUpdate: Player) => {
    const currentWeight = playerToUpdate.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3;
    updatePlayer(playerToUpdate.id, { weight: nextWeight });
    setSelectedPlayer(prev => prev ? { ...prev, weight: nextWeight } : null);
  };

  const handleDeletePlayer = (playerId: string) => {
    deletePlayer(playerId);
    setStatsModalVisible(false);
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

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
      {sessionPlayers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>Nenhum jogador selecionado.</Text>
          <Text style={[styles.hint, { color: theme.placeholder }]}>Vá para a tela 'Jogadores' para escolher quem vai jogar.</Text>
        </View>
      ) : (
        <View style={{ flex: 1, marginTop: 8 }}>
          <FlatList
            data={[...sessionPlayers].sort((a, b) => {
              if (a.active && !b.active) return -1;
              if (!a.active && b.active) return 1;
              return a.name.localeCompare(b.name);
            })}
            keyExtractor={(item) => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PlayerCard
                player={item}
                darkMode={darkMode}
                onToggleActive={() => togglePlayerActive(item.id)}
                onLongPress={() => openPlayerStatsModal(item)}
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
          <LinearGradient colors={[theme.background, `${theme.background}00`]} style={[styles.topFadeEffect, { pointerEvents: 'none' as const }]} />
          {fadeHeight > 0 && <LinearGradient colors={[`${theme.background}00`, theme.background]} style={[styles.fadeEffect, { height: fadeHeight, pointerEvents: 'none' as const }]} />}
        </View>
      )}
      <View style={styles.editFooter}>
        <TeamSizeSlider value={teamSize} onValueChange={setTeamSize} darkMode={darkMode} />
        <Text style={[styles.hint, { color: theme.placeholder, textAlign: 'center' }]}>Jogadores ativos: {activeCount}</Text>
      </View>

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

      <EditNameModal
        visible={isEditNameModalVisible}
        player={selectedPlayer}
        onClose={() => {
          setIsEditNameModalVisible(false);
          setStatsModalVisible(true);
        }}
        onSave={handleSaveName}
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
