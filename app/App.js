import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Simple Volleyball Team Drawer (Expo / React Native)
 * - Two screens: Editar Lista and Sortear
 * - Paste names, import, toggle active/inactive
 * - Choose team size (4-6)
 * - Shuffle and distribute players into balanced teams
 */

export default function App() {
  const [screen, setScreen] = useState("edit"); // "edit" or "draw"
  const [rawInput, setRawInput] = useState("");
  const [players, setPlayers] = useState([]); // { id, name, active }
  const [teamSize, setTeamSize] = useState(6);
  const [teams, setTeams] = useState([]);

  // Helpers
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

  function importNames() {
    const lines = rawInput
      .split(/\r?\n|,|;/) // split by newline, comma, semicolon
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      Alert.alert("Nada para importar", "Cole ou digite nomes antes de importar.");
      return;
    }

    const newPlayers = lines.map((name) => ({
      id: generateId(),
      name,
      active: true,
    }));

    // Avoid exact duplicates (same name)
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()));
    const filtered = newPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()));

    setPlayers((prev) => [...prev, ...filtered]);
    setRawInput("");
  }

  function toggleActive(id) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  // Shuffle (Fisher-Yates)
  function shuffleArray(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Distribute into balanced teams
  function distributeBalanced(shuffled, teamSizeDesired) {
    const n = shuffled.length;
    if (n === 0) return [];
    const numTeams = Math.max(1, Math.ceil(n / teamSizeDesired));
    const teams = Array.from({ length: numTeams }, () => []);
    // Round-robin assignment gives balanced teams
    for (let i = 0; i < n; i++) {
      teams[i % numTeams].push(shuffled[i]);
    }
    return teams;
  }

  function drawTeams() {
    const activePlayers = players.filter((p) => p.active).map((p) => p.name);
    if (activePlayers.length === 0) {
      Alert.alert("Sem jogadores ativos", "Ative pelo menos um jogador antes de sortear.");
      return;
    }
    const shuffled = shuffleArray(activePlayers);
    const distributed = distributeBalanced(shuffled, teamSize);
    setTeams(distributed);
    setScreen("draw");
  }

  // Quick stats
  const activeCount = useMemo(() => players.filter((p) => p.active).length, [players]);

  // Small UI components
  const SizeButton = ({ size }) => (
    <TouchableOpacity
      style={[styles.sizeBtn, teamSize === size && styles.sizeBtnSelected]}
      onPress={() => setTeamSize(size)}
    >
      <Text style={[styles.sizeBtnText, teamSize === size && styles.sizeBtnTextSelected]}>
        {size}
      </Text>
    </TouchableOpacity>
  );

  const PlayerItem = ({ item }) => (
    <View style={styles.playerRow}>
      <Text style={[styles.playerName, !item.active && styles.playerNameInactive]}>
        {item.name}
      </Text>
      <View style={styles.playerControls}>
        <Switch value={item.active} onValueChange={() => toggleActive(item.id)} />
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() =>
            Alert.alert("Remover jogador", `Remover ${item.name}?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Remover", style: "destructive", onPress: () => removePlayer(item.id) },
            ])
          }
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render
  return (
    <SafeAreaView style={styles.container}>
      {/* Top navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={[styles.navBtn, screen === "edit" && styles.navBtnActive]}
          onPress={() => setScreen("edit")}
        >
          <Text style={styles.navBtnText}>Editar lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, screen === "draw" && styles.navBtnActive]}
          onPress={() => setScreen("draw")}
        >
          <Text style={styles.navBtnText}>Sortear</Text>
        </TouchableOpacity>
      </View>

      {screen === "edit" ? (
        <View style={styles.screen}>
          <Text style={styles.heading}>Cole os nomes (uma linha por jogador)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Ex: João\nMaria\nPedro"
            value={rawInput}
            onChangeText={setRawInput}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={importNames}>
              <Text style={styles.buttonText}>Importar nomes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#777" }]}
              onPress={() =>
                Alert.alert(
                  "Limpar tudo",
                  "Tem certeza que quer remover todos os jogadores?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Limpar",
                      style: "destructive",
                      onPress: () => {
                        setPlayers([]);
                        setTeams([]);
                      },
                    },
                  ]
                )
              }
            >
              <Text style={styles.buttonText}>Limpar tudo</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subheading, { marginTop: 12 }]}>Tamanho por time</Text>
          <View style={styles.sizeRow}>
            <SizeButton size={4} />
            <SizeButton size={5} />
            <SizeButton size={6} />
          </View>
          <Text style={styles.hint}>
            Jogadores ativos: {activeCount} • Tamanho selecionado: {teamSize}
          </Text>

          <Text style={[styles.subheading, { marginTop: 12 }]}>Lista de jogadores</Text>
          {players.length === 0 ? (
            <Text style={styles.hint}>Nenhum jogador ainda — importe nomes acima.</Text>
          ) : (
            <FlatList
              style={styles.list}
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PlayerItem item={item} />}
            />
          )}
        </View>
      ) : (
        <View style={styles.screen}>
          <Text style={styles.heading}>Sortear times</Text>
          <Text style={styles.hint}>Ativos: {activeCount} — tamanho por time: {teamSize}</Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={styles.button} onPress={drawTeams}>
              <Text style={styles.buttonText}>Sortear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#777" }]}
              onPress={() => {
                // quick reshuffle only if there are existing teams
                if (players.filter((p) => p.active).length === 0) {
                  Alert.alert("Sem jogadores ativos", "Ative jogadores na tela 'Editar lista'.");
                  return;
                }
                drawTeams();
              }}
            >
              <Text style={styles.buttonText}>Sortear novamente</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginTop: 16 }}>
            {teams.length === 0 ? (
              <Text style={styles.hint}>Ainda não foi sorteado — clique em "Sortear".</Text>
            ) : (
              teams.map((t, idx) => (
                <View key={idx} style={styles.teamCard}>
                  <Text style={styles.teamTitle}>Time {idx + 1} ({t.length})</Text>
                  {t.map((name, i) => (
                    <Text key={i} style={styles.teamPlayer}>
                      • {name}
                    </Text>
                  ))}
                </View>
              ))
            )}

            {/* Show list of active players as reference */}
            <View style={{ height: 20 }} />
            <Text style={styles.subheading}>Jogadores ativos (referência)</Text>
            {players.filter((p) => p.active).length === 0 ? (
              <Text style={styles.hint}>Nenhum jogador ativo.</Text>
            ) : (
              players
                .filter((p) => p.active)
                .map((p) => (
                  <Text key={p.id} style={styles.teamPlayer}>
                    • {p.name}
                  </Text>
                ))
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Protótipo — React Native + Expo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  navBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  navBtnActive: { backgroundColor: "#0b8", shadowColor: "#000", elevation: 2 },
  navBtnText: { fontWeight: "600" },

  screen: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  subheading: { fontSize: 15, fontWeight: "600" },

  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },

  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  button: {
    backgroundColor: "#0a84ff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  buttonText: { color: "#fff", fontWeight: "600" },

  sizeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  sizeBtn: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  sizeBtnSelected: { backgroundColor: "#0a84ff", borderColor: "#0a84ff" },
  sizeBtnText: { fontWeight: "600" },
  sizeBtnTextSelected: { color: "#fff" },

  hint: { color: "#555", marginTop: 6 },

  list: { marginTop: 8 },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  playerName: { fontSize: 16 },
  playerNameInactive: { color: "#999", textDecorationLine: "line-through" },
  playerControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnText: { color: "#b00", fontWeight: "700" },

  teamCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  teamTitle: { fontWeight: "700", marginBottom: 6 },
  teamPlayer: { marginLeft: 6, marginBottom: 4 },

  footer: { padding: 8, alignItems: "center", borderTopWidth: 1, borderTopColor: "#eee" },
  footerText: { color: "#666" },
});
