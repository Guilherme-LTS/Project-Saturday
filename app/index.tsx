import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SortWinRateIcon from '../assets/icons/award.svg';
import SortLevelIcon from '../assets/icons/bar-chart-2.svg';
import EyeOffIcon from '../assets/icons/eye-off.svg';
import EyeIcon from '../assets/icons/eye.svg';
import SortAlphaIcon from '../assets/icons/sort-alpha.svg';
import SortSessionIcon from '../assets/icons/sort-session.svg';
import BottomNav from "../components/BottomNav";
import CourtView from '../components/CourtView';
import EditNameModal from '../components/EditNameModal';
import MatchHistoryCard from '../components/MatchHistoryCard';
import PlayerCard from "../components/PlayerCard";
import PlayerOptionsModal from '../components/PlayerOptionsModal';
import TeamCard from "../components/TeamCard";
import TeamSizeSlider from '../components/TeamSizeSlider';
import useTheme from "../hooks/useTheme";
import { Match, Player, Screen, SortMode, Team, TeamSize } from "../types";
import { loadMatchHistory, loadPlayers, loadSelectedPlayerIds, loadTheme, saveMatchHistory, savePlayers, saveSelectedPlayerIds, saveTheme } from '../utils/storage';

export default function App() {
  const [screen, setScreen] = useState<Screen>("players");
  const [rawInput, setRawInput] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize>(6);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leftoverPlayers, setLeftoverPlayers] = useState<string[]>([]);
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
  const [playersWhoJustEntered, setPlayersWhoJustEntered] = useState<Set<string>>(new Set());
  const [showCourtView, setShowCourtView] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');

  // 2. Usando nosso hook de tema
  const theme = useTheme(darkMode);

  useEffect(() => {
  async function loadInitialData() {
    // Carrega os jogadores
    const storedPlayers = await loadPlayers();
    if (storedPlayers.length > 0) {
      setAllPlayers(storedPlayers);
    }
    // Carrega o tema
    const storedThemeIsDark = await loadTheme();
    setDarkMode(storedThemeIsDark);

    // Carrega os IDs dos jogadores selecionados
    const storedIds = await loadSelectedPlayerIds();
    setSelectedPlayerIds(storedIds);

    // Carrega o histórico de partidas
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
    if (!isLoading) {
      saveTheme(darkMode);
    }
  }, [darkMode, isLoading]);
  
  useEffect(() => {
    // Só salva a seleção se o carregamento inicial já tiver terminado
    if (!isLoading) {
      saveSelectedPlayerIds(selectedPlayerIds);
    }
  }, [selectedPlayerIds, isLoading]);

  useEffect(() => {
    // Salva a lista principal apenas se o carregamento inicial já terminou
    if (!isLoading) {
      savePlayers(allPlayers);
    }
  }, [allPlayers, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveMatchHistory(matchHistory);
    }
  }, [matchHistory, isLoading]);

  const insets = useSafeAreaInsets();

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  function shuffleArray<T>(a: T[]): T[] {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function balanceTeamsByWeight(activePlayers: Player[], size: number): Team[] {
    const n = activePlayers.length;
    if (n === 0) return [];

    const numTeams = Math.floor(n / size);
    if (numTeams === 0) {
      Alert.alert("Jogadores Insuficientes", `São necessários pelo menos ${size} jogadores para formar um time.`);
      return [];
    }

    // CORRIGIDO AQUI
    const teamsState: Team[] = Array.from({ length: numTeams }, () => ({ players: [], total: 0 }));

    const pool = shuffleArray(activePlayers.slice()).sort((a, b) => b.weight - a.weight);

    for (const p of pool) {
      let bestIdx = -1;
      let bestTotal = Infinity;
      for (let i = 0; i < numTeams; i++) {
        const t = teamsState[i];
        // CORRIGIDO AQUI
        if (t.players.length < size && t.total < bestTotal) {
          bestTotal = t.total;
          bestIdx = i;
        }
      }
      
      if (bestIdx !== -1) {
        // CORRIGIDO AQUI
        teamsState[bestIdx].players.push(p);
        teamsState[bestIdx].total += p.weight;
      }
    }
    
    // CORRIGIDO AQUI
    return teamsState.filter((t) => t.players.length > 0);
  }

  function balanceTeamsByWinRate(activePlayers: Player[], size: number): Team[] {
    const n = activePlayers.length;
    if (n === 0) return [];

    const numTeams = Math.floor(n / size);
    if (numTeams === 0) {
      Alert.alert("Jogadores Insuficientes", `São necessários pelo menos ${size} jogadores para formar um time.`);
      return [];
    }

    // CORRIGIDO AQUI
    const teamsState: Team[] = Array.from({ length: numTeams }, () => ({ players: [], total: 0 }));

    const playerPool = activePlayers.map(player => {
      const winRate = calculateWinRate(player.name);
      return {
        ...player,
        winRate: winRate === null ? 50 : winRate,
      };
    });

    const sortedPool = shuffleArray(playerPool).sort((a, b) => b.winRate - a.winRate);

    for (const p of sortedPool) {
      let bestIdx = -1;
      let bestTotal = Infinity;
      for (let i = 0; i < numTeams; i++) {
        const t = teamsState[i];
        // CORRIGIDO AQUI
        if (t.players.length < size && t.total < bestTotal) {
          bestTotal = t.total;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) {
        // CORRIGIDO AQUI
        teamsState[bestIdx].players.push(p);
        teamsState[bestIdx].total += p.winRate;
      }
    }

    // CORRIGIDO AQUI
    return teamsState.filter((t) => t.players.length > 0);
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

  function handleDraw() {
    const activePlayers = sessionPlayers.filter((p) => p.active);

    if (activePlayers.length === 0) {
      Alert.alert("Sem jogadores ativos", "Vá para a tela 'Editar Lista' e ative os jogadores.");
      return;
    }

    // A memória de imunidade não é mais tocada aqui.
    
    const distributed = balanceMode === 'level'
      ? balanceTeamsByWeight(activePlayers, teamSize)
      : balanceTeamsByWinRate(activePlayers, teamSize);
    
    const drawnPlayerNames = new Set(distributed.flatMap(team => team.players.map(p => p.name)));
    
    const inactivePlayersInSession = sessionPlayers.filter(p => !p.active).map(p => p.name);
    const leftoversFromDraw = activePlayers
      .filter(player => !drawnPlayerNames.has(player.name))
      .map(player => player.name);
    
    const finalLeftovers = [...new Set([...inactivePlayersInSession, ...leftoversFromDraw])];
    
    setTeams(distributed);
    setLeftoverPlayers(finalLeftovers);
    setWinnerIndex(null);
    setDisplayedBalanceMode(balanceMode);
    setScreen("draw");
  }

  function handleEndMatchAndSubstitute() {
    if (winnerIndex === null) {
      Alert.alert("Selecione um vencedor", "Marque o time vencedor antes de finalizar a partida.");
      return;
    }
    
    // 1. Salva a partida no histórico
    const finishedMatch: Match = {
      id: new Date().toISOString(), date: new Date().toISOString(), teams: teams, winnerTeamIndex: winnerIndex,
    };
    setMatchHistory(prevHistory => [finishedMatch, ...prevHistory]);

    // 2. Prepara os dados para a substituição
    const playersToEnter = leftoverPlayers;

    // Se não há ninguém para entrar, apenas reseta a imunidade e limpa a tela
    if (playersToEnter.length === 0) {
      setPlayersWhoJustEntered(new Set());
      setTeams([]);
      setWinnerIndex(null);
      return;
    }
    
    const losingTeamIndex = winnerIndex === 0 ? 1 : 0;
    const losingTeam = teams[losingTeamIndex];
    
    const losingTeamPlayerNames = losingTeam.players.map(p => p.name);
    const eligibleToLeave = losingTeamPlayerNames.filter(name => !playersWhoJustEntered.has(name));
    const numToSubstitute = playersToEnter.length;

    if (eligibleToLeave.length < numToSubstitute) {
      Alert.alert("Não é possível substituir", "O time perdedor não tem jogadores suficientes que possam sair. A partida foi salva no histórico. Faça um novo sorteio.");
      setTeams([]);
      setWinnerIndex(null);
      setPlayersWhoJustEntered(new Set());
      return;
    }
    
    // A variável 'playersToLeave' é criada aqui...
    const playersToLeave = shuffleArray(eligibleToLeave).slice(0, numToSubstitute);
    
    // ...e usada somente depois, o que é o correto.
    setAllPlayers(prevAllPlayers =>
      prevAllPlayers.map(player => {
        if (playersToLeave.includes(player.name)) return { ...player, active: false };
        if (playersToEnter.includes(player.name)) return { ...player, active: true };
        return player;
      })
    );
    
    // 4. Atualiza os estados para a próxima rodada
    setLeftoverPlayers(playersToLeave);
    setPlayersWhoJustEntered(new Set(playersToEnter));

    // 5. Limpa a tela
    setTeams([]);
    setWinnerIndex(null);
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
    const rate = calculateWinRate(player.name);
    setPlayerWinRate(rate);
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
    setIsModalVisible(false); // Fecha o modal de opções
    setIsEditNameModalVisible(true); // Abre o modal de edição de nome
  }

  function updatePlayerName(playerId: string, newName: string) {
    setAllPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, name: newName } : p))
    );
  }

  function deleteAllPlayers() {
    Alert.alert(
      "Apagar Todos os Jogadores?",
      "Esta ação é permanente e não pode ser desfeita. Tem certeza?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sim, Apagar Tudo",
          style: "destructive",
          onPress: () => {
            setAllPlayers([]);
            setSelectedPlayerIds(new Set());
          },
        },
      ]
    );
  }

  function normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function handleCycleWeight(player: Player) {
    const currentWeight = player.weight;
    // Lógica para ciclar: 1 -> 2, 2 -> 3, 3 -> 1
    const nextWeight = (currentWeight % 3) + 1 as 1 | 2 | 3;
    
    // Chama a função original com os argumentos corretos
    updatePlayerWeight(player.id, nextWeight);
  }

  function removePlayerPhoto(playerId: string) {
    setAllPlayers(prevPlayers => 
      prevPlayers.map(p => {
        if (p.id === playerId) {
          return { ...p, photoUri: undefined };
        }
        return p;
      })
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

  function calculateWinRate(playerName: string) {
    let gamesPlayed = 0;
    let gamesWon = 0;

    // Itera sobre cada partida no histórico
    for (const match of matchHistory) {
      let playedInMatch = false;

      // Verifica se o jogador estava em algum dos times da partida
      match.teams.forEach((team, index) => {
        if (team.players.some(p => p.name === playerName)) {
          playedInMatch = true;
          // Se ele estava no time vencedor, incrementa as vitórias
          if (index === match.winnerTeamIndex) {
            gamesWon++;
          }
        }
      });

      if (playedInMatch) {
        gamesPlayed++;
      }
    }

    // Se o jogador nunca jogou, retorna null para não mostrar nada
    if (gamesPlayed === 0) {
      return null;
    }

    // Calcula a porcentagem e arredonda
    return Math.round((gamesWon / gamesPlayed) * 100);
  }

  function deleteMatchHistory() {
    // Mostra um alerta de confirmação
    Alert.alert(
      "Apagar Histórico de Partidas?",
      "Esta ação é permanente e não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sim, Apagar Histórico",
          style: "destructive",
          onPress: () => {
            // Se o usuário confirmar, limpa o estado do histórico
            setMatchHistory([]);
            // O useEffect salvará a lista vazia automaticamente
          },
        },
      ]
    );
  }

  function deleteSingleMatch(matchId: string) {
    Alert.alert(
      "Apagar Partida?",
      "Tem certeza que deseja apagar esta partida do histórico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            setMatchHistory(prev => prev.filter(match => match.id !== matchId));
          },
        },
      ]
    );
  }

  function deleteMatchesByDate(dateTitle: string) {
    Alert.alert(
      `Apagar partidas de ${dateTitle}?`,
      "Esta ação é permanente e apagará todos os jogos deste dia.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Apagar",
          style: "destructive",
          onPress: () => {
            setMatchHistory(prev =>
              prev.filter(match => {
                const matchDate = new Date(match.date).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                });
                return matchDate !== dateTitle;
              })
            );
          },
        },
      ]
    );
  }

  function cycleSortMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sortMode === 'alphabetical') {
      setSortMode('level');
    } else if (sortMode === 'level') {
      setSortMode('winrate');
    } else if (sortMode === 'winrate') {
      setSortMode('session'); // Adiciona o novo modo
    } else {
      setSortMode('alphabetical'); // Volta para o início
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

    if (pickerResult.canceled) {
      return;
    }

    const tempUri = pickerResult.assets[0].uri;
    const fileName = `${playerToUpdate.id}.jpg`;
    const permanentUri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });

      // O truque: adicionamos um timestamp à URI para forçar a imagem a recarregar
      const cacheBustedUri = `${permanentUri}?t=${new Date().getTime()}`;

      // Atualiza o estado com a nova URI "cache-busted"
      setAllPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === playerToUpdate.id ? { ...p, photoUri: cacheBustedUri } : p
        )
      );
      // --- FIM DA CORREÇÃO ---

    } catch (error) {
      console.error("Erro ao copiar a imagem:", error);
    }
  }

  const sessionPlayers = useMemo(
    () => allPlayers.filter(p => selectedPlayerIds.has(p.id)),
    [allPlayers, selectedPlayerIds]
  );
  
  const filteredPlayers = useMemo(() => {
    // 1. Primeiro, filtra todos os jogadores com base na busca
    const filteredBySearch = allPlayers.filter(p => 
      normalizeString(p.name).includes(normalizeString(searchQuery))
    );

    // 2. Depois, aplica a lógica de ordenação sobre o resultado filtrado
    switch (sortMode) {
      case 'level':
        return filteredBySearch.sort((a, b) => b.weight - a.weight);
      case 'winrate':
        return filteredBySearch.sort((a, b) => {
          const rateA = calculateWinRate(a.name) ?? -1;
          const rateB = calculateWinRate(b.name) ?? -1;
          return rateB - rateA;
        });
      // NOVO MODO 'SESSION'
      case 'session':
        return filteredBySearch.sort((a, b) => {
          const aIsSelected = selectedPlayerIds.has(a.id);
          const bIsSelected = selectedPlayerIds.has(b.id);
          // Se 'b' está selecionado e 'a' não, 'b' vem primeiro.
          if (bIsSelected && !aIsSelected) return 1;
          // Se 'a' está selecionado e 'b' não, 'a' vem primeiro.
          if (aIsSelected && !bIsSelected) return -1;
          // Se ambos estão selecionados (ou não), ordena por nome.
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
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    return Object.entries(grouped).map(([date, matches]) => ({
      title: date,
      data: matches,
    }));
  }, [matchHistory]);
  
  // --- Renderização ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1 }}>
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
              // Usando ScrollView para permitir as duas listas sem conflito de rolagem
              <ScrollView showsVerticalScrollIndicator={false}> 
                <Text style={[styles.subheading, { color: theme.text, marginTop: 12, marginBottom: 8 }]}>
                  Jogadores ativos na partida
                </Text>
                {/* CORREÇÃO: Primeira FlatList apenas para jogadores ATIVOS */}
                <FlatList
                  data={sessionPlayers.filter((p) => p.active)}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false} // Desabilita a rolagem da FlatList interna
                  columnWrapperStyle={{ marginBottom: 8 }}
                  renderItem={({ item }) => (
                    <PlayerCard
                      player={item}
                      darkMode={darkMode}
                      onToggleActive={toggleActive}
                      onLongPress={openPlayerOptionsModal}
                      variant="grid"
                    />
                  )}
                />

                {/* CORREÇÃO: Segunda FlatList apenas para jogadores INATIVOS */}
                {sessionPlayers.some((p) => !p.active) && (
                    <FlatList
                        data={sessionPlayers.filter((p) => !p.active)}
                        keyExtractor={(item) => item.id}
                        numColumns={3} // Mantendo 3 colunas para inativos, como no original
                        scrollEnabled={false} // Desabilita a rolagem
                        columnWrapperStyle={{ marginBottom: 8 }}
                        ListHeaderComponent={() => (
                        <View style={styles.titleRow}>
                            <Text style={[styles.subheading, { color: theme.text }]}>
                            Jogadores desabilitados
                            </Text>
                            <TouchableOpacity
                            onPress={() => {
                              Alert.alert("Reabilitar Jogadores", "Tem certeza que deseja reabilitar todos os jogadores desabilitados?", [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Reabilitar", onPress: () => { 
                                // Reabilita todos os jogadores inativos
                                const inactiveIds = sessionPlayers.filter(p => !p.active).map(p => p.id);
                                setAllPlayers(prev => prev.map(p => inactiveIds.includes(p.id) ? { ...p, active: true } : p));
                                } },
                              ]);
                            }}
                            >
                            <Text style={{ color: '#0a84ff', fontWeight: "bold", fontSize: 24 }}>+</Text>
                            </TouchableOpacity>
                        </View>
                        )}
                        renderItem={({ item }) => (
                            <PlayerCard
                                player={item}
                                darkMode={darkMode}
                                onToggleActive={toggleActive}
                                onLongPress={openPlayerOptionsModal}
                                variant="grid"
                            />
                        )}
                    />
                )}
              </ScrollView>
            )}
            <View style={styles.actionRow}>
              <View style={styles.sliderContainer}>
                <TeamSizeSlider
                  value={teamSize}
                  onValueChange={setTeamSize}
                  darkMode={darkMode}
                />
              </View>
            </View>
            <Text style={[styles.hint, { color: theme.placeholder }]}>
              Jogadores ativos: {activeCount} • Tamanho selecionado: {teamSize}
            </Text>
          </View>
        )}

        {screen === "draw" && (
          // O container principal da tela, com flex: 1
          <View style={styles.screen}>
            
            {/* 1. CONTAINER DO CONTEÚDO - A chave é este `flex: 1` */}
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
                  winnerIndex={winnerIndex} // Passa o índice do vencedor
                  onSelectWinner={(index) => setWinnerIndex(index === winnerIndex ? null : index)} // Passa a função de clique
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

            {/* 2. RODAPÉ - agora ele é empurrado para baixo pelo container acima */}
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

        {screen === "players" && (
          <View style={styles.screen}>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Buscar jogador..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[styles.sortButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={cycleSortMode}
              >
                {sortMode === 'alphabetical' && <SortAlphaIcon fill={theme.text} width={24} height={24} />}
                {sortMode === 'level' && <SortLevelIcon stroke={theme.text} width={24} height={24} />}
                {sortMode === 'winrate' && <SortWinRateIcon stroke={theme.text} width={24} height={24} />}
                {sortMode === 'session' && <SortSessionIcon stroke={theme.text} width={24} height={24} />}
              </TouchableOpacity>
            </View>
            <View style={[styles.addContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
                          style={[styles.button, { backgroundColor: theme.primary, marginTop: 8 }]}
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
              renderItem={({ item }) => (
                <PlayerCard
                  player={item}
                  darkMode={darkMode}
                  onToggleActive={() => {}} // Não usado aqui
                  onLongPress={openPlayerOptionsModal}
                  variant="list"
                  selectable={true}
                  isSelected={selectedPlayerIds.has(item.id)}
                  onSelect={togglePlayerSelection}
                />
              )}
            />
          </View>
        )}

        {screen === "history" && (
          <View style={styles.screen}>
            <Text style={[styles.heading, { color: theme.text, marginBottom: 16 }]}>Histórico de Partidas</Text>
            {historySections.length === 0 ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={[styles.hint, { color: theme.placeholder, fontSize: 16 }]}>Nenhuma partida foi salva ainda.</Text>
              </View>
            ) : (
              <SectionList
                sections={historySections}
                keyExtractor={(item) => item.id}
                renderSectionHeader={({ section: { title } }) => {
                  const isExpanded = expandedSections.has(title);
                  return (
                    <TouchableOpacity 
                      style={[styles.sectionHeader, { backgroundColor: theme.border }]} 
                      onPress={() => toggleSection(title)}
                      onLongPress={() => {
                        deleteMatchesByDate(title)
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      }}
                    >
                      <Text style={[styles.subheading, { color: theme.text }]}>{title}</Text>
                      <Text style={[styles.arrow, { color: theme.text }]}>{isExpanded ? "▲" : "▼"}</Text>
                    </TouchableOpacity>
                  );
                }}
                renderItem={({ item, section }) => {
                  // Só renderiza os itens da seção se ela estiver expandida
                  if (!expandedSections.has(section.title)) {
                    return null;
                  }
                  return <MatchHistoryCard
                    match={item} 
                    darkMode={darkMode}
                    onDelete={deleteSingleMatch}
                  />;
                }}
              />
            )}
          </View>
        )}

        {screen === "settings" && (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[styles.heading, { color: theme.text, marginBottom: 20 }]}>Configurações</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: darkMode ? 56 : 50 }]} onPress={() => setDarkMode(!darkMode)}>
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

        {/* 6. Usando o BottomNav */}
        <BottomNav
          activeScreen={screen}
          onScreenChange={setScreen}
          darkMode={darkMode} 
          bottomInset={0}
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
        winRate={playerWinRate}
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

// 7. Os estilos restantes são apenas para layout
const styles = StyleSheet.create({
    container: { flex: 1 },
    screen: { flex: 1, padding: 16, paddingBottom: 8 },
    heading: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    subheading: { fontSize: 15, fontWeight: "600" },
    textArea: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: "#ddd",
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
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 'auto',
      paddingVertical: 8,
      gap: 8,
    },
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
      color: '#8a6d3b', // Uma cor de texto escura para contraste
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
      flex: 1, // Ocupa 25% do espaço (1 de 4 partes)
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawButton: {
      flex: 3, // Ocupa 75% do espaço (3 de 4 partes)
      borderRadius: 8,
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawFooter: {
      paddingTop: 8,
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
      flex: 1, // Faz a caixa de busca se esticar
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
});