import { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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

type Player = { id: string; name: string; active: boolean };

const screenWidth = Dimensions.get("window").width;
const cardMargin = 8;

export default function App() {
  const [screen, setScreen] = useState<"edit" | "draw" | "settings">("edit");
  const [rawInput, setRawInput] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamSize, setTeamSize] = useState<4 | 5 | 6>(6);
  const [teams, setTeams] = useState<string[][]>([]);
  const sizes: (4 | 5 | 6)[] = [4, 5, 6];
  const [showInput, setShowInput] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // --- Funções do App ---
  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  function importNames() {
    const lines = rawInput
      .split(/\r?\n|,|;/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      Alert.alert("Nada para importar", "Cole ou digite nomes antes de importar.");
      return;
    }

    setPlayers((prev) => {
      const existing = new Set(prev.map((p) => p.name.toLowerCase()));
      const newOnes: Player[] = lines
        .filter((name) => !existing.has(name.toLowerCase()))
        .map((name) => ({
          id: generateId(),
          name,
          active: true,
        }));
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

  function shuffleArray<T>(a: T[]): T[] {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function distributeFixedSize(shuffled: string[], size: number): string[][] {
    const n = shuffled.length;
    if (n === 0) return [];

    const numTeams = Math.ceil(n / size);
    const out: string[][] = Array.from({ length: numTeams }, () => []);

    let currentTeam = 0;
    for (let i = 0; i < n; i++) {
      out[currentTeam].push(shuffled[i]);
      if (out[currentTeam].length >= size) currentTeam++;
    }

    return out;
  }

  function drawTeams() {
    const activePlayers = players.filter((p) => p.active).map((p) => p.name);
    if (activePlayers.length === 0) {
      Alert.alert("Sem jogadores ativos", "Ative pelo menos um jogador antes de sortear.");
      return;
    }
    const shuffled = shuffleArray(activePlayers);
    const distributed = distributeFixedSize(shuffled, teamSize);
    setTeams(distributed);
    setScreen("draw");
  }

  const activeCount = useMemo(
    () => players.filter((p) => p.active).length,
    [players]
  );

  // --- Componentes ---
  const SizeButton = ({ size }: { size: 4 | 5 | 6 }) => (
    <TouchableOpacity
      style={[
        styles.sizeBtn,
        teamSize === size && styles.sizeBtnSelected,
        { backgroundColor: teamSize === size ? (darkMode ? "#388E3C" : "#388E3C") : "#4CAF50" },
      ]}
      onPress={() => setTeamSize(size)}
    >
      <Text
        style={[
          styles.sizeBtnText,
          teamSize === size && styles.sizeBtnTextSelected,
        ]}
      >
        {size}
      </Text>
    </TouchableOpacity>
  );

  const PlayerCard = ({ item }: { item: Player }) => (
    <TouchableOpacity
      style={[
        styles.playerCard,
        { backgroundColor: darkMode ? "#333" : "#fff" },
        !item.active && { backgroundColor: darkMode ? "#141414ff" : "#f0f0f0" },
      ]}
      onPress={() => toggleActive(item.id)}
    >
      <Text
        style={[
          styles.playerName,
          { color: darkMode ? "#fff" : "#222" },
          !item.active && styles.playerNameInactive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const SettingsScreen = () => {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.heading, { marginBottom: 20, color: darkMode ? "#fff" : "#222" }]}>Configurações</Text>
        <TouchableOpacity
          style={[styles.button, { paddingVertical: 12, paddingHorizontal: 20 }]}
          onPress={() => setDarkMode(!darkMode)}
        >
          <Text style={styles.buttonText}>
            {darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Cores do tema ---
  const containerStyle = { flex: 1, backgroundColor: darkMode ? "#000000ff" : "#f5f6fa" };
  const textStyle = { color: darkMode ? "#fff" : "#222" };

  // --- Render ---
  return (
    <SafeAreaView style={[styles.container, containerStyle, { paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ flex: 1 }}>
        {screen === "edit" ? (
          <View style={styles.screen}>
            <Text style={[styles.heading, textStyle]}>Cole os nomes (uma linha por jogador)</Text>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setShowInput(!showInput)}
            >
              <Text style={styles.subheading}>Adicionar jogadores</Text>
              <Text style={styles.arrow}>{showInput ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {showInput && (
              <TextInput
                style={[styles.textArea, { backgroundColor: darkMode ? "#222" : "#fff", color: darkMode ? "#fff" : "#000" }]}
                multiline
                placeholder="Ex: João&#10;Maria&#10;Pedro"
                placeholderTextColor={darkMode ? "#888" : "#888"}
                value={rawInput}
                onChangeText={setRawInput}
              />
            )}

            <View style={styles.titleRow}>
              <Text style={[styles.subheading, textStyle]}>Lista de jogadores</Text>
            </View>

            {players.length === 0 ? (
              <Text style={[styles.hint, { color: darkMode ? "#aaa" : "#888" }]}>Nenhum jogador ainda</Text>
            ) : (
              <>
                <FlatList
                  data={players.filter(p => p.active).sort((a,b)=>a.name.localeCompare(b.name))}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 4 }}
                  contentContainerStyle={{ paddingBottom: 4, paddingHorizontal: 4 }}
                  renderItem={({ item }) => <PlayerCard item={item} />}
                />

                <FlatList
                  data={players.filter(p => !p.active).sort((a,b)=>a.name.localeCompare(b.name))}
                  keyExtractor={item => item.id}
                  numColumns={3}
                  columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 4 }}
                  contentContainerStyle={{ paddingBottom: 4, paddingHorizontal: 4 }}
                  renderItem={({ item }) => <PlayerCard item={item} />}
                  ListHeaderComponent={() =>
                    players.some(p => !p.active) ? (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                        <Text style={[styles.subheading, textStyle]}>Jogadores desabilitados</Text>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Excluir jogadores",
                              "Tem certeza que deseja excluir todos os jogadores desabilitados?",
                              [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Excluir", style: "destructive", onPress: () => setPlayers(prev => prev.filter(p => p.active)) },
                              ]
                            )
                          }
                        >
                          <Text style={{ color: "red", fontWeight: "bold", fontSize: 16 }}>X</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null
                  }
                />
              </>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
              {sizes.map((s) => (
                <SizeButton key={s} size={s} />
              ))}
              <TouchableOpacity
                style={[styles.button, { paddingVertical: 10, paddingHorizontal: 8, flexShrink: 1 }]}
                onPress={importNames}
              >
                <Text style={styles.buttonText}>Importar nomes</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: darkMode ? "#aaa" : "#888" }]}>
              Jogadores ativos: {activeCount} • Tamanho selecionado: {teamSize}
            </Text>
          </View>
        ) : screen === "draw" ? (
          <View style={styles.screen}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {teams.length === 0 ? (
                <Text style={[styles.hint, { color: darkMode ? "#aaa" : "#888" }]}>Ainda não foi sorteado — clique em "Sortear".</Text>
              ) : (
                teams.map((t, idx) => (
                  <View key={idx} style={[styles.teamCard, { backgroundColor: darkMode ? "#333" : "#fff", borderColor: darkMode ? "#555" : "#eee" }]}>
                    <Text style={[styles.teamTitle, { color: darkMode ? "#0a84ff" : "#0a84ff" }]}>
                      Time {idx + 1} ({t.length})
                    </Text>
                    {t.map((name, i) => (
                      <Text key={i} style={[styles.teamPlayer, { color: darkMode ? "#fff" : "#222" }]}>• {name}</Text>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ padding: 16 }}>
              <TouchableOpacity style={styles.button} onPress={drawTeams}>
                <Text style={styles.buttonText}>Sortear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SettingsScreen />
        )}

        <View style={[styles.bottomNav, { backgroundColor: darkMode ? "#222" : "#fff", borderColor: darkMode ? "#555" : "#eee" }]}>
          <TouchableOpacity
            style={[styles.navBtn, screen === "edit" && styles.navBtnActive]}
            onPress={() => setScreen("edit")}
          >
            <Text style={[styles.navBtnText, screen === "edit" && styles.navBtnTextActive, { color: darkMode ? "#fff" : "#555" }]}>Editar lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, screen === "draw" && styles.navBtnActive]}
            onPress={() => setScreen("draw")}
          >
            <Text style={[styles.navBtnText, screen === "draw" && styles.navBtnTextActive, { color: darkMode ? "#fff" : "#555" }]}>Sortear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, screen === "settings" && styles.navBtnActive]}
            onPress={() => setScreen("settings")}
          >
            <Text style={[styles.navBtnText, screen === "settings" && styles.navBtnTextActive, { color: darkMode ? "#fff" : "#555" }]}>Configurações</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1, padding: 16, paddingBottom: 8 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  subheading: { fontSize: 15, fontWeight: "600" },
  sizeRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#0a84ff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },

  sizeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    margin: 5,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeBtnSelected: {},
  sizeBtnText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  sizeBtnTextSelected: { textDecorationLine: "underline" },

  hint: { fontSize: 12, marginTop: 4, marginBottom: 4 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  playerCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: cardMargin / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: { fontSize: 20, fontWeight: "600" },
  playerNameInactive: { fontSize: 12, color: "#bbb", textDecorationLine: "line-through" },

  teamCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  teamTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6 },
  teamPlayer: { fontSize: 15, marginLeft: 8, marginBottom: 2 },

  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 8,
    justifyContent: "space-around",
  },
  navBtn: { flex: 1, padding: 10, alignItems: "center" },
  navBtnActive: { borderBottomWidth: 2, borderColor: "#0a84ff" },
  navBtnText: { fontSize: 15, fontWeight: "600" },
  navBtnTextActive: { color: "#0a84ff" },

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
});
