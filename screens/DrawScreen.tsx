import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EyeOffIcon from '../assets/icons/eye-off.svg';
import EyeIcon from '../assets/icons/eye.svg';
import CourtView from '../components/CourtView';
import TeamCard from '../components/TeamCard';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';

export default function DrawScreen() {
  // --- Hooks ---
  const insets = useSafeAreaInsets();
  const {
    teams,
    winnerIndex,
    setWinnerIndex,
    balanceMode,
    setBalanceMode,
    displayedBalanceMode,
    showCourtView,
    setShowCourtView,
    drawTeams,
    endMatchAndSubstitute,
  } = useGameStore();
  const { allPlayers, selectedPlayerIds } = usePlayersStore();
  const { darkMode } = useThemeStore();
  const theme = useTheme(darkMode);

  // --- Memoized Values ---
  const activePlayersForDraw = useMemo(() => {
    return allPlayers.filter(p => selectedPlayerIds.has(p.id) && p.active);
  }, [allPlayers, selectedPlayerIds]);

  // --- Handlers ---

  const sessionPlayers = useMemo(() => {
    return allPlayers.filter(p => selectedPlayerIds.has(p.id));
  }, [allPlayers, selectedPlayerIds]);

  const handleDraw = () => {
    // We still check for active players before drawing.
    const activePlayerCount = sessionPlayers.filter(p => p.active).length;
    if (activePlayerCount < 2) {
      Alert.alert('Jogadores Insuficientes', 'Você precisa de pelo menos 2 jogadores ativos para sortear os times.');
      { cancelable: true }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // ✅ FIX: Pass the entire list of session players to the action.
    drawTeams(sessionPlayers);
  };

  const handleEndMatchAndSubstitute = () => {
    if (winnerIndex === null) {
      Alert.alert("Selecione um vencedor", "Marque o time vencedor para registrar a partida.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endMatchAndSubstitute(); // Call the store action
  };
  
  const handleSelectWinner = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWinnerIndex(index === winnerIndex ? null : index);
  };

  const handleToggleBalanceMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalanceMode(balanceMode === 'level' ? 'winrate' : 'level');
  };

  return (
     <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        {teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
              Clique em "Sortear Times" para começar.
            </Text>
          </View>
        ) : showCourtView ? (
          <CourtView
            teams={teams}
            darkMode={darkMode}
            winnerIndex={winnerIndex}
            onSelectWinner={handleSelectWinner}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {teams.map((t, idx) => (
              <TeamCard
                key={idx}
                team={t}
                teamNumber={idx + 1}
                darkMode={darkMode}
                showWinnerCheckbox={true}
                isWinner={idx === winnerIndex}
                onSelectWinner={() => handleSelectWinner(idx)}
                balanceMode={displayedBalanceMode}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.drawFooter}>
        {teams.length > 0 && (
          <View style={[styles.actionsRow, { marginBottom: 8 }]}>
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: theme.border }]}
              onPress={() => setShowCourtView(!showCourtView)}
            >
              {showCourtView
                ? <EyeOffIcon stroke={theme.text} width={24} height={24} />
                : <EyeIcon stroke={theme.text} width={24} height={24} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawButton, {
                backgroundColor: winnerIndex === null ? theme.placeholder : theme.accentGreen
              }]}
              onPress={handleEndMatchAndSubstitute}
              disabled={winnerIndex === null}
            >
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>Finalizar Partida</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.border }]}
            onPress={handleToggleBalanceMode}
          >
            <Text style={[styles.buttonText, { color: theme.text, fontSize: 14 }]}>
              {balanceMode === 'level' ? 'Por Nível' : 'Por Vitória'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.drawButton, { backgroundColor: theme.primary, paddingVertical: 14 }]}
            onPress={handleDraw}
          >
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              {teams.length > 0 ? 'Sortear Novamente' : 'Sortear Times'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 4, textAlign: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  toggleButton: { flex: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  drawButton: { flex: 3, borderRadius: 8, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  drawFooter: { paddingTop: 4, paddingBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 8 },
});