// app/index.tsx (versão final, completa e sem duplicatas)

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import SortWinRateIcon from '../assets/icons/award.svg';
import SortLevelIcon from '../assets/icons/bar-chart-2.svg';
import EyeOffIcon from '../assets/icons/eye-off.svg';
import EyeIcon from '../assets/icons/eye.svg';
import SortAlphaIcon from '../assets/icons/sort-alpha.svg';
import SortSessionIcon from '../assets/icons/sort-session.svg';
import BottomNav from "../components/BottomNav";
import CourtView from '../components/CourtView';
import EditNameModal from '../components/EditNameModal';
import HistoryDayCard from '../components/HistoryDayCard';
import MatchDetailCard from '../components/MatchDetailCard';
import PlayerCard from "../components/PlayerCard";
import PlayerOptionsModal from '../components/PlayerOptionsModal';
import TeamCard from "../components/TeamCard";
import TeamSizeSlider from '../components/TeamSizeSlider';
import useTheme from "../hooks/useTheme";
import { Match, Player, Screen, SortMode, Team, TeamSize } from "../types";
import { calculatePlayerStats } from '../utils/helpers';
import { loadMatchHistory, loadPlayers, loadSelectedPlayerIds, loadTheme, saveMatchHistory, savePlayers, saveSelectedPlayerIds, saveTheme } from '../utils/storage';

export default function App() {
  const [screen, setScreen] = useState<Screen>("players");
  const [rawInput, setRawInput] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize>(6);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditNameModalVisible, setIsEditNameModalVisible] = useState(false);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [playerWinRate, setPlayerWinRate] = useState<number | null>(null);
  const [balanceMode, setBalanceMode] = useState<'level' | 'winrate'>('level');
  const [displayedBalanceMode, setDisplayedBalanceMode] = useState<'level' | 'winrate'>('level');
  const [showCourtView, setShowCourtView] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [leftoverPlayerIds, setLeftoverPlayerIds] = useState<string[]>([]);
  const [playersWhoJustEnteredIds, setPlayersWhoJustEnteredIds] = useState<Set<string>>(new Set());
  const [fadeHeight, setFadeHeight] = useState(60);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const theme = useTheme(darkMode);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function loadInitialData() {
      const storedPlayers = await loadPlayers();
      if (storedPlayers.length > 0) setAllPlayers(storedPlayers);
      const storedThemeIsDark = await loadTheme();
      setDarkMode(storedThemeIsDark);
      const storedIds = await loadSelectedPlayerIds();
      setSelectedPlayerIds(storedIds);
      const storedHistory = await loadMatchHistory();
      setMatchHistory(storedHistory);
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    NavigationBar.setButtonStyleAsync('light');
  }, [darkMode, theme]);

  useEffect(() => {
    if (!isLoading) saveTheme(darkMode);
  }, [darkMode, isLoading]);
  
  useEffect(() => {
    if (!isLoading) saveSelectedPlayerIds(selectedPlayerIds);
  }, [selectedPlayerIds, isLoading]);

  useEffect(() => {
    if (!isLoading) savePlayers(allPlayers);
  }, [allPlayers, isLoading]);

  useEffect(() => {
    if (!isLoading) saveMatchHistory(matchHistory);
  }, [matchHistory, isLoading]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(darkMode ? '#222' : '#FFF');
  }, [darkMode]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
  
  function shuffleArray<T>(a: T[]): T[] {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  function normalizeString(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function balanceTeamsByWeight(activePlayers: Player[], size: number): Team[] {
    const n = activePlayers.length;
    if (n === 0) return [];
    const numTeams = Math.floor(n / size);
    if (numTeams === 0) {
      Alert.alert("Jogadores Insuficientes", `São necessários pelo menos ${size} jogadores.`);
      return [];
    }
    const teamsState: Team[] = Array.from({ length: numTeams }, () => ({ players: [], total: 0 }));
    const pool = shuffleArray(activePlayers.slice()).sort((a, b) => b.weight - a.weight);
    for (const p of pool) {
      let bestIdx = -1;
      let bestTotal = Infinity;
      for (let i = 0; i < numTeams; i++) {
        const t = teamsState[i];
        if (t.players.length < size && t.total < bestTotal) {
          bestTotal = t.total;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) {
        teamsState[bestIdx].players.push(p);
        teamsState[bestIdx].total += p.weight;
      }
    }
    return teamsState.filter((t) => t.players.length > 0);
  }

  function balanceTeamsByWinRate(activePlayers: Player[], size: number): Team[] {
    const n = activePlayers.length;
    if (n === 0) return [];
    const numTeams = Math.floor(n / size);
    if (numTeams === 0) {
      Alert.alert("Jogadores Insuficientes", `São necessários pelo menos ${size} jogadores.`);
      return [];
    }
    const teamsState: Team[] = Array.from({ length: numTeams }, () => ({ players: [], total: 0 }));
    const playerPool = activePlayers.map(player => ({
      ...player,
      winRate: calculateWinRate(player.id) ?? 50,
    }));
    const sortedPool = shuffleArray(playerPool).sort((a, b) => b.winRate - a.winRate);
    for (const p of sortedPool) {
      let bestIdx = -1;
      let bestTotal = Infinity;
      for (let i = 0; i < numTeams; i++) {
        const t = teamsState[i];
        if (t.players.length < size && t.total < bestTotal) {
          bestTotal = t.total;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) {
        teamsState[bestIdx].players.push(p);
        teamsState[bestIdx].total += p.winRate;
      }
    }
    return teamsState.filter((t) => t.players.length > 0);
  }

  function calculateWinRate(playerId: string): number | null {
    let gamesPlayed = 0;
    let gamesWon = 0;
    for (const match of matchHistory) {
      let playedInMatch = false;
      match.teams.forEach((team, index) => {
        if (team.players.some(p => p.id === playerId)) {
          playedInMatch = true;
          if (index === match.winnerTeamIndex) gamesWon++;
        }
      });
      if (playedInMatch) gamesPlayed++;
    }
    if (gamesPlayed === 0) return null;
    return Math.round((gamesWon / gamesPlayed) * 100);
  }

  function handleDraw() {
    const activePlayers = sessionPlayers.filter(p => p.active);
    if (activePlayers.length === 0) {
      Alert.alert("Sem jogadores ativos", "Ative os jogadores na tela 'Editar Lista'.");
      return;
    }
    const distributed = balanceMode === 'level'
      ? balanceTeamsByWeight(activePlayers, teamSize)
      : balanceTeamsByWinRate(activePlayers, teamSize);
    
    const drawnPlayerIds = new Set(distributed.flatMap(team => team.players.map(p => p.id)));
    
    const inactivePlayerIdsInSession = sessionPlayers.filter(p => !p.active).map(p => p.id);
    const leftoversFromDrawIds = activePlayers
      .filter(player => !drawnPlayerIds.has(player.id))
      .map(player => player.id);
    
    const finalLeftoverIds = [...new Set([...inactivePlayerIdsInSession, ...leftoversFromDrawIds])];
    
    setTeams(distributed);
    setLeftoverPlayerIds(finalLeftoverIds);
    setWinnerIndex(null);
    setDisplayedBalanceMode(balanceMode);
    setScreen("draw");
  }

  function handleEndMatchAndSubstitute() {
    if (winnerIndex === null) {
      Alert.alert("Selecione um vencedor", "Marque o time vencedor.");
      return;
    }
    const finishedMatch: Match = {
      id: new Date().toISOString(), date: new Date().toISOString(), teams: teams, winnerTeamIndex: winnerIndex,
    };
    setMatchHistory(prev => [finishedMatch, ...prev]);
    
    const playersToEnterIds = leftoverPlayerIds;
    if (playersToEnterIds.length === 0) {
      setPlayersWhoJustEnteredIds(new Set());
      setTeams([]);
      setWinnerIndex(null);
      return;
    }
    
    const losingTeamIndex = winnerIndex === 0 ? 1 : 0;
    const losingTeam = teams[losingTeamIndex];
    const losingTeamPlayerIds = losingTeam.players.map(p => p.id);
    const eligibleToLeaveIds = losingTeamPlayerIds.filter(id => !playersWhoJustEnteredIds.has(id));
    
    if (eligibleToLeaveIds.length < playersToEnterIds.length) {
      Alert.alert("Não é possível substituir", "O time perdedor não tem jogadores suficientes que possam sair.");
      setTeams([]);
      setWinnerIndex(null);
      setPlayersWhoJustEnteredIds(new Set());
      return;
    }
    
    const playersToLeaveIds = shuffleArray(eligibleToLeaveIds).slice(0, playersToEnterIds.length);
    
    setAllPlayers(prev =>
      prev.map(player => {
        if (playersToLeaveIds.includes(player.id)) return { ...player, active: false };
        if (playersToEnterIds.includes(player.id)) return { ...player, active: true };
        return player;
      })
    );
    
    setLeftoverPlayerIds(playersToLeaveIds);
    setPlayersWhoJustEnteredIds(new Set(playersToEnterIds));
    setTeams([]);
    setWinnerIndex(null);
  }

  function importNames() {
    const lines = rawInput.split(/\r?\n|,|;/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const newPlayers: Player[] = [];
    const newSelectedIds = new Set(selectedPlayerIds);
    const existingNames = new Set(allPlayers.map(p => p.name.toLowerCase()));
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
        const newPlayer = { id: generateId(), name, active: true, weight };
        newPlayers.push(newPlayer);
        newSelectedIds.add(newPlayer.id);
      }
    });
    if (newPlayers.length > 0) {
      setAllPlayers(prev => [...prev, ...newPlayers]);
      setSelectedPlayerIds(newSelectedIds);
    }
    setRawInput("");
    setShowInput(false);
  }

  function toggleActive(id: string) {
    setAllPlayers(prev =>
      prev.map(p => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }

  function deletePlayer(playerId: string) {
    Alert.alert("Apagar Jogador", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => {
          setAllPlayers(prev => prev.filter(p => p.id !== playerId));
          const newSet = new Set(selectedPlayerIds);
          newSet.delete(playerId);
          setSelectedPlayerIds(newSet);
        }},
    ]);
  }

  function updatePlayerWeight(playerId: string, newWeight: 1 | 2 | 3) {
    setAllPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, weight: newWeight } : p))
    );
  }

  function openPlayerOptionsModal(player: Player) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const stats = calculatePlayerStats(player.id, matchHistory);
    setPlayerWinRate(stats.winRate);
    setSelectedPlayerId(player.id);
    setIsModalVisible(true);
  }

  function togglePlayerSelection(playerId: string) {
    const newSet = new Set(selectedPlayerIds);
    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }
    setSelectedPlayerIds(newSet);
  }

  function openEditNameModal() {
    setIsModalVisible(false);
    setIsEditNameModalVisible(true);
  }

  function updatePlayerName(playerId: string, newName: string) {
    setAllPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, name: newName } : p))
    );
  }

  function deleteAllPlayers() {
    Alert.alert("Apagar Todos os Jogadores?", "Esta ação é permanente. Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim, Apagar Tudo", style: "destructive", onPress: () => {
          setAllPlayers([]);
          setSelectedPlayerIds(new Set());
        }},
    ]);
  }
  
  function handleCycleWeight(player: Player) {
    const currentWeight = player.weight;
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3;
    updatePlayerWeight(player.id, nextWeight);
  }

  function removePlayerPhoto(playerId: string) {
    setAllPlayers(prevPlayers => 
      prevPlayers.map(p => (p.id === playerId ? { ...p, photoUri: undefined } : p))
    );
  }

  function toggleSection(sectionTitle: string) {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionTitle)) {
      newSet.delete(sectionTitle);
    } else {
      newSet.add(sectionTitle);
    }
    setExpandedSections(newSet);
  }
  
  function deleteMatchHistory() {
    Alert.alert("Apagar Histórico de Partidas?", "Esta ação é permanente.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim, Apagar Histórico", style: "destructive", onPress: () => setMatchHistory([]) },
    ]);
  }

  function deleteSingleMatch(matchId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Apagar Partida?", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => setMatchHistory(prev => prev.filter(match => match.id !== matchId)) },
    ]);
  }

  function deleteMatchesByDate(dateTitle: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(`Apagar partidas de ${dateTitle}?`, "Esta ação é permanente.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim, Apagar", style: "destructive", onPress: () => {
          setMatchHistory(prev =>
            prev.filter(match => {
              const matchDate = new Date(match.date).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              });
              return matchDate !== dateTitle;
            })
          );
        }},
    ]);
  }

  function cycleSortMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sortMode === 'alphabetical') {
      setSortMode('level');
    } else if (sortMode === 'level') {
      setSortMode('winrate');
    } else if (sortMode === 'winrate') {
      setSortMode('session');
    } else {
      setSortMode('alphabetical');
    }
  }

  async function pickImageAndUpdatePlayer(playerToUpdate: Player) {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("É necessária a permissão para acessar suas fotos!");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (pickerResult.canceled) return;
    const tempUri = pickerResult.assets[0].uri;
    const fileName = `${playerToUpdate.id}.jpg`;
    const permanentUri = FileSystem.documentDirectory + fileName;
    try {
      await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
      const cacheBustedUri = `${permanentUri}?t=${new Date().getTime()}`;
      setAllPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === playerToUpdate.id ? { ...p, photoUri: cacheBustedUri } : p
        )
      );
    } catch (error) {
      console.error("Erro ao copiar a imagem:", error);
    }
  }

  const sessionPlayers = useMemo(
    () => allPlayers.filter(p => selectedPlayerIds.has(p.id)),
    [allPlayers, selectedPlayerIds]
  );
  
  const filteredPlayers = useMemo(() => {
    const filteredBySearch = allPlayers.filter(p => 
      normalizeString(p.name).includes(normalizeString(searchQuery))
    );
    switch (sortMode) {
      case 'level':
        return filteredBySearch.sort((a, b) => b.weight - a.weight);
      case 'winrate':
        return filteredBySearch.sort((a, b) => {
          const rateA = calculatePlayerStats(a.id, matchHistory).winRate ?? -1;
          const rateB = calculatePlayerStats(b.id, matchHistory).winRate ?? -1;
          return rateB - rateA;
        });
      case 'session':
        return filteredBySearch.sort((a, b) => {
          const aIsSelected = selectedPlayerIds.has(a.id);
          const bIsSelected = selectedPlayerIds.has(b.id);
          if (bIsSelected && !aIsSelected) return 1;
          if (aIsSelected && !bIsSelected) return -1;
          return a.name.localeCompare(b.name);
        });
      case 'alphabetical':
      default:
        return filteredBySearch.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [allPlayers, searchQuery, sortMode, selectedPlayerIds]);
  
  const activeCount = useMemo(
    () => sessionPlayers.filter((p) => p.active).length,
    [sessionPlayers]
  );

  const selectedPlayer = useMemo(
    () => allPlayers.find((p) => p.id === selectedPlayerId) ?? null,
    [allPlayers, selectedPlayerId]
  );

  const historySections = useMemo(() => {
    const grouped = matchHistory.reduce((acc, match) => {
      const date = new Date(match.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
    return Object.entries(grouped).map(([date, matches]) => ({
      title: date,
      data: matches,
    }));
  }, [matchHistory]);
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1 }}>
        
        {screen === "players" && (
          <View style={styles.screen}>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { flex: 1, backgroundColor: theme.cardInactive, color: theme.text, borderColor: theme.cardInactive }]}
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
                          style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
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
                  onLongPress={openPlayerOptionsModal}
                  variant="list"
                  selectable={true}
                  isSelected={selectedPlayerIds.has(item.id)}
                  onSelect={togglePlayerSelection}
                  matchHistory={matchHistory}
                />
              )}
            />
          </View>
        )}

        {screen === "edit" && (
          <View style={styles.screen}>
            {sessionPlayers.length === 0 ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
                  Nenhum jogador selecionado.
                </Text>
                <Text style={[styles.hint, { color: theme.placeholder }]}>
                  Vá para a tela 'Jogadores' para escolher quem vai jogar.
                </Text>
              </View>
            ) : (
              // A nova lista única e ordenada
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
                      onToggleActive={toggleActive}
                      onLongPress={openPlayerOptionsModal}
                      variant="grid"
                      matchHistory={matchHistory}
                    />
                  )}
                  contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  columnWrapperStyle={{ gap: 0.5 }}
                  
                  onContentSizeChange={(contentWidth, contentHeight) => {
                    if (contentHeight < layoutHeight) {
                      setFadeHeight(0);
                    }
                  }}
                  
                  onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setLayoutHeight(height);
                  }}
                  
                  onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const maxFadeHeight = 60;
                    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
                    const newHeight = Math.max(30, Math.min(maxFadeHeight, distanceFromBottom));
                    setFadeHeight(newHeight);
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

            {/* O rodapé com o slider e o contador */}
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
          </View>
        )}

        {screen === "draw" && (
          <View style={styles.screen}>
            
            {/* 1. CONTAINER DO CONTEÚDO - com flex: 1, ele empurra o rodapé para baixo */}
            <View style={{ flex: 1 }}>
              {teams.length === 0 ? (
                // Mensagem de "Ainda não foi sorteado"
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>
                    Clique em "Sortear Times" para começar.
                  </Text>
                </View>
              ) : showCourtView ? (
                // A visualização da quadra
                <CourtView
                  teams={teams}
                  darkMode={darkMode}
                  winnerIndex={winnerIndex}
                  onSelectWinner={(index) => setWinnerIndex(index === winnerIndex ? null : index)}
                />
              ) : (
                // A lista de times
                <ScrollView>
                  {teams.map((t, idx) => (
                    <TeamCard
                      key={idx}
                      team={t}
                      teamNumber={idx + 1}
                      darkMode={darkMode}
                      showWinnerCheckbox={true}
                      isWinner={idx === winnerIndex}
                      onSelectWinner={() => setWinnerIndex(idx === winnerIndex ? null : idx)}
                      balanceMode={displayedBalanceMode}
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 2. RODAPÉ - agora ele fica fixo no fundo */}
            <View style={styles.drawFooter}>
              
              {/* Botões extras que só aparecem DEPOIS do sorteio */}
              {teams.length > 0 && (
                <View style={[styles.actionsRow, { marginBottom: 8 }]}>
                  <TouchableOpacity 
                    style={[styles.toggleButton, { backgroundColor: theme.border }]}
                    onPress={() => setShowCourtView(prev => !prev)}
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

              {/* Botões principais que estão SEMPRE na parte de baixo */}
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.toggleButton, { backgroundColor: theme.border }]}
                  onPress={() => setBalanceMode(prev => prev === 'level' ? 'winrate' : 'level')}
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
        )}

        {screen === "history" && (
          <View style={styles.screen}>
            {selectedDate === null ? (
              // TELA 1: LISTA DE DIAS COM PARTIDAS <>
              <>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: theme.cardInactive, color: theme.text, borderColor: theme.cardInactive, marginBottom: 16 }]}
                  placeholder="Buscar por data (ex: 25 de agosto...)"
                  placeholderTextColor={theme.placeholder}
                  value={historySearchQuery}
                  onChangeText={setHistorySearchQuery} 
                />
                {historySections.length === 0 ? (
                  <view style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>Nenhuma partida foi salva ainda.</Text>
                  </view>
                ) : (
                  <FlatList
                    data={historySections.filter(section =>
                      section.title.toLowerCase().includes(historySearchQuery.toLowerCase())
                    )}
                    keyExtractor={(item) => item.title}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <HistoryDayCard
                        date={item.title}
                        matchCount={item.data.length}
                        onPress={() => setSelectedDate(item.title)}
                        onLongPress={() => deleteMatchesByDate(item.title)} 
                        darkMode={darkMode}
                      />
                    )}
                  />
                )}
              </>
            ) : (
              // TELA 2: DETALHES DAS PARTIDAS DE UM DIA
              <>
                <View style={styles.backButton}>
                  {/* 1. Apenas o ícone é envolto em um TouchableOpacity */}
                  <TouchableOpacity
                    onPress={() => setSelectedDate(null)}
                    style={{ padding: 4 }}
                  >
                    <ArrowLeftIcon stroke={theme.text} width={26} height={26} />
                  </TouchableOpacity>
                  <Text style={[styles.heading, { color: theme.text, marginLeft: 10, marginTop: 6 }]}>
                    {selectedDate}
                  </Text>
                </View>
                
                <FlatList
                  data={historySections.find(s => s.title === selectedDate)?.data || []}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <MatchDetailCard
                      match={item}
                      matchNumber={index + 1}
                      darkMode={darkMode}
                      onDelete={deleteSingleMatch}
                      animationSpeed={100}
                    />
                  )}
                  contentContainerStyle={{ paddingTop: 16 }}
                />
              </>
            )}
          </View>
        )}

        {screen === "settings" && (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[styles.heading, { color: theme.text, marginBottom: 20 }]}>Configurações</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: darkMode ? 55 : 50 }]} onPress={() => setDarkMode(!darkMode)}>
                    <Text style={[styles.buttonText, { color: theme.primaryText }]}>{darkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.danger, marginTop: 16, paddingVertical: 12, paddingHorizontal: 20 }]} onPress={deleteAllPlayers}>
                    <Text style={[styles.buttonText, { color: theme.primaryText }]}>Apagar Todos os Jogadores</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.danger, marginTop: 16, paddingVertical: 12, paddingHorizontal: 60 }]} onPress={deleteMatchHistory}>
                    <Text style={[styles.buttonText, { color: theme.primaryText }]}>Apagar Histórico</Text>
                </TouchableOpacity>
            </View>
        )}

        <BottomNav
          activeScreen={screen}
          onScreenChange={setScreen}
          darkMode={darkMode} 
          bottomInset={insets.bottom}
        />
      </View>

      <PlayerOptionsModal
        visible={isModalVisible}
        player={selectedPlayer}
        darkMode={darkMode}
        onClose={() => setIsModalVisible(false)}
        onDelete={deletePlayer}
        onUpdateWeight={handleCycleWeight}
        onEditName={openEditNameModal}
        onChangePhoto={pickImageAndUpdatePlayer}
        onRemovePhoto={removePlayerPhoto}
        matchHistory={matchHistory}
      />
      <EditNameModal
        visible={isEditNameModalVisible}
        player={selectedPlayer}
        darkMode={darkMode}
        onClose={() => setIsEditNameModalVisible(false)}
        onSave={updatePlayerName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    screen: { flex: 1, padding: 16, paddingBottom: 0 },
    heading: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    subheading: { fontSize: 15, fontWeight: "600" },
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
    hint: { fontSize: 12, marginTop: 4, marginBottom: 4, textAlign: 'center' },
    dropdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    arrow: { fontSize: 18 },
    sliderContainer: {
      flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        marginBottom: 8,
    },
    leftoverContainer: {
      backgroundColor: '#fffbe6',
      borderColor: '#ffe58f',
      borderWidth: 1,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    leftoverText: {
      color: '#8a6d3b',
      fontWeight: '500',
      textAlign: 'center',
    },
    addContainer: {
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    dropdownContent: {
      paddingBottom: 8,
    },
    historyCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    toggleButton: {
      flex: 1,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawButton: {
      flex: 3,
      borderRadius: 8,
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawFooter: {
      paddingTop: 4,
      paddingBottom: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
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
    editFooter: {
      paddingTop: 8,
    },
    fadeEffect: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 50, // A altura do efeito de degradê. Ajuste conforme seu gosto.
    },
    topFadeEffect: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0, // Posiciona no topo
      height: 15, // Uma altura menor para o topo, ajuste se desejar
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
});