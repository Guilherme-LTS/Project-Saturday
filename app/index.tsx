import * as NavigationBar from 'expo-navigation-bar';
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
  View,
} from "react-native";

// 1. Importando nossos tipos e componentes customizados
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from "../components/BottomNav";
import PlayerCard from "../components/PlayerCard";
import PlayerOptionsModal from '../components/PlayerOptionsModal';
import TeamCard from "../components/TeamCard";
import TeamSizeSlider from '../components/TeamSizeSlider';
import useTheme from "../hooks/useTheme";
import { Player, Screen, Team, TeamSize } from "../types";
import { loadPlayers, loadSelectedPlayerIds, loadTheme, savePlayers, saveSelectedPlayerIds, saveTheme } from '../utils/storage';

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
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // A "base de dados" de todos os jogadores
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set()); // IDs dos jogadores na partida atual
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

    // MUDANÇA 1: Usar Math.floor para priorizar o tamanho do time.
    // Para 13 jogadores e tamanho 6, isso resultará em 2 times.
    const numTeams = Math.floor(n / size);

    // Se não houver jogadores suficientes para formar nem um time, retorna vazio.
    if (numTeams === 0) {
      Alert.alert(
        "Jogadores Insuficientes",
        `São necessários pelo menos ${size} jogadores para formar um time.`
      );
      return [];
    }

    const teamsState: Team[] = Array.from(
      { length: numTeams },
      () => ({ names: [], total: 0 })
    );

    // Embaralha para quebrar empates e depois ordena por peso desc
    const pool = shuffleArray(activePlayers.slice()).sort((a, b) => b.weight - a.weight);

    for (const p of pool) {
      // escolhe o time com menor soma de pesos que ainda tem vaga
      let bestIdx = -1;
      let bestTotal = Infinity;
      for (let i = 0; i < numTeams; i++) {
        const t = teamsState[i];
        if (t.names.length < size && t.total < bestTotal) {
          bestTotal = t.total;
          bestIdx = i;
        }
      }
      
      // Adiciona o jogador apenas se um time válido (com vaga) foi encontrado
      if (bestIdx !== -1) {
        teamsState[bestIdx].names.push(p.name);
        teamsState[bestIdx].total += p.weight;
      }
      
      // MUDANÇA 2: O bloco de código de "fallback" que existia aqui foi removido.
    }

  return teamsState.filter((t) => t.names.length > 0);
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

  function drawTeams() {
    const activePlayers = sessionPlayers.filter((p) => p.active);
    if (activePlayers.length === 0) {
      Alert.alert("Sem jogadores ativos", "Ative pelo menos um jogador antes de sortear.");
      setLeftoverPlayers([]);
      return;
    }
    const distributed = balanceTeamsByWeight(activePlayers, teamSize);
    const drawnPlayerNames = new Set(distributed.flatMap(team => team.names));
    const leftovers = activePlayers
      .filter(player => !drawnPlayerNames.has(player.name))
      .map(player => player.name);
    
    setTeams(distributed);
    setLeftoverPlayers(leftovers);
    setScreen("draw");
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

  const sessionPlayers = useMemo(
    () => allPlayers.filter(p => selectedPlayerIds.has(p.id)),
    [allPlayers, selectedPlayerIds]
  );
  
  const filteredPlayers = useMemo(
    () => allPlayers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [allPlayers, searchQuery]
  );
  
  const activeCount = useMemo(
    () => sessionPlayers.filter((p) => p.active).length,
    [sessionPlayers]
  );

  const selectedPlayer = useMemo(
    () => allPlayers.find((p) => p.id === selectedPlayerId) ?? null,
    [allPlayers, selectedPlayerId]
  );
  
  // --- Renderização ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1 }}>
        {screen === "edit" && (
          <View style={styles.screen}>
            <TouchableOpacity
              style={[styles.dropdownHeader, { backgroundColor: theme.border }]}
              onPress={() => setShowInput(!showInput)}
            >
              <Text style={[styles.subheading, { color: theme.text }]}>Adicionar jogadores</Text>
              <Text style={[styles.arrow, { color: theme.text }]}>{showInput ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {showInput && (
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                multiline
                placeholder={"Ex: João 3\nPedro\nnome e peso (nivel 1, 2 ou 3)"}
                placeholderTextColor={theme.placeholder}
                value={rawInput}
                onChangeText={setRawInput}
              />
            )}

            {sessionPlayers.length === 0 ? (
              <Text style={[styles.hint, { color: theme.placeholder, marginTop: 20 }]}>Nenhum jogador ainda</Text>
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
                            onPress={() =>
                                Alert.alert(
                                "Excluir jogadores",
                                "Tem certeza que deseja excluir todos os jogadores desabilitados?",
                                [
                                    { text: "Cancelar", style: "cancel" },
                                    {
                                    text: "Excluir",
                                    style: "destructive",
                                    onPress: () =>
                                        setAllPlayers((prev) =>
                                        prev.filter((p) => p.active)
                                        ),
                                    },
                                ]
                                )
                            }
                            >
                            <Text style={{ color: theme.danger, fontWeight: "bold", fontSize: 16 }}>X</Text>
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
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={importNames}
              >
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Importar nomes</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: theme.placeholder }]}>
              Jogadores ativos: {activeCount} • Tamanho selecionado: {teamSize}
            </Text>
          </View>
        )}

        {screen === "draw" && (
          <View style={styles.screen}>
            <ScrollView style={{ flex: 1 }}>
              {teams.length === 0 ? (
                <Text style={[styles.hint, { color: theme.placeholder }]}>Ainda não foi sorteado.</Text>
              ) : (
                teams.map((t, idx) => (
                  // 5. Usando o TeamCard
                  <TeamCard
                    key={idx}
                    team={t}
                    teamNumber={idx + 1}
                    darkMode={darkMode}
                  />
                ))
              )}
            </ScrollView>
            <View style={{ padding: 16 }}>
              {leftoverPlayers.length > 0 && (
                <View style={styles.leftoverContainer}>
                  <Text style={styles.leftoverText}>
                    {leftoverPlayers.join(', ')}
                    {leftoverPlayers.length === 1 ? ' ficou de fora.' : ' ficaram de fora.'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={drawTeams}>
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Sortear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {screen === "players" && (
          <View style={styles.screen}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Buscar jogador..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredPlayers.sort((a,b) => a.name.localeCompare(b.name))}
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

        {screen === "settings" && (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[styles.heading, { color: theme.text, marginBottom: 20 }]}>Configurações</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 20 }]} onPress={() => setDarkMode(!darkMode)}>
                    <Text style={[styles.buttonText, { color: theme.primaryText }]}>{darkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}</Text>
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
        onUpdateWeight={updatePlayerWeight} 
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
        padding: 8,
        backgroundColor: "#eee",
        borderRadius: 8,
        marginVertical: 6,
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
    searchInput: {
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      fontSize: 16,
      marginBottom: 12,
  },
});