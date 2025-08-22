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

export default function App() {
  const [screen, setScreen] = useState<Screen>("edit");
  const [rawInput, setRawInput] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamSize, setTeamSize] = useState<TeamSize>(6);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leftoverPlayers, setLeftoverPlayers] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // 2. Usando nosso hook de tema
  const theme = useTheme(darkMode);
  useEffect(() => {
    NavigationBar.setButtonStyleAsync(darkMode ? 'light' : 'dark'); 
  }, [darkMode, theme]);
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
    const lines = rawInput
      .split(/\r?\n|,|;/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      Alert.alert(
        "Nada para importar",
        "Cole ou digite nomes antes de importar."
      );
      return;
    }
    setPlayers((prev) => {
      const existing = new Set(prev.map((p) => p.name.toLowerCase()));
      const newOnes: Player[] = lines
        .map((line) => {
          const parts = line.split(/\s+/);
          let weight: 1 | 2 | 3 = 2;
          const last = parts[parts.length - 1];
          if (["1", "2", "3"].includes(last)) {
            weight = parseInt(last) as 1 | 2 | 3;
            parts.pop();
          }
          const name = parts.join(" ");
          return { id: generateId(), name, active: true, weight };
        })
        .filter(
          (p) => p.name.length > 0 && !existing.has(p.name.toLowerCase())
        );
      if (newOnes.length === 0) return prev;
      return [...prev, ...newOnes];
    });
    setRawInput("");
    setShowInput(false);
  }

  function toggleActive(id: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }

  function drawTeams() {
    const activePlayers = players.filter((p) => p.active);
    if (activePlayers.length === 0) {
      Alert.alert(
        "Sem jogadores ativos",
        "Ative pelo menos um jogador antes de sortear."
      );
      // Limpa a lista de sobras se não houver sorteio
      setLeftoverPlayers([]);
      return;
    }

    const distributed = balanceTeamsByWeight(activePlayers, teamSize);
    
    // --- LÓGICA NOVA COMEÇA AQUI ---

    // 1. Pega os nomes de todos os jogadores que foram colocados em um time
    const drawnPlayerNames = new Set(distributed.flatMap(team => team.names));

    // 2. Filtra a lista de jogadores ativos para encontrar quem NÃO está na lista de sorteados
    const leftovers = activePlayers
      .filter(player => !drawnPlayerNames.has(player.name))
      .map(player => player.name);

    // 3. Atualiza os estados
    setTeams(distributed);
    setLeftoverPlayers(leftovers); // Guarda os nomes de quem ficou de fora
    setScreen("draw");
  }

  function deletePlayer(playerId: string) {
    Alert.alert(
      "Apagar Jogador",
      "Tem certeza que deseja apagar este jogador permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
          },
        },
      ]
    );
  }

  function updatePlayerWeight(playerId: string, newWeight: 1 | 2 | 3) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, weight: newWeight } : p))
    );
  }

  function openPlayerOptionsModal(player: Player) {
    setSelectedPlayerId(player.id);
    setIsModalVisible(true);
  }

  const activeCount = useMemo(
    () => players.filter((p) => p.active).length,
    [players]
  );

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
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

            {players.length === 0 ? (
              <Text style={[styles.hint, { color: theme.placeholder, marginTop: 20 }]}>Nenhum jogador ainda</Text>
            ) : (
              // Usando ScrollView para permitir as duas listas sem conflito de rolagem
              <ScrollView showsVerticalScrollIndicator={false}> 
                <Text style={[styles.subheading, { color: theme.text, marginTop: 12, marginBottom: 8 }]}>
                  Jogadores ativos
                </Text>
                {/* CORREÇÃO: Primeira FlatList apenas para jogadores ATIVOS */}
                <FlatList
                  data={players
                    .filter((p) => p.active)
                    .sort((a, b) => a.name.localeCompare(b.name))}
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
                    />
                  )}
                />

                {/* CORREÇÃO: Segunda FlatList apenas para jogadores INATIVOS */}
                {players.some((p) => !p.active) && (
                    <FlatList
                        data={players
                        .filter((p) => !p.active)
                        .sort((a, b) => a.name.localeCompare(b.name))}
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
                                        setPlayers((prev) =>
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
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>Sortear Novamente</Text>
              </TouchableOpacity>
            </View>
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
});