import { Alert } from 'react-native';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Match, Player, PlayerFundamentals, Team, TeamSize } from '../types';
import { calculatePlayerStats } from '../utils/helpers';
import { loadMatchHistory, saveMatchHistory } from '../utils/storage';
import { usePlayersStore } from './playersStore';

// --- Funções Auxiliares para o Novo Algoritmo ---

/**
 * Retorna um objeto de fundamentos padrão para jogadores que não os possuem.
 */
const getDefaultFundamentals = (): PlayerFundamentals => ({
  serve: 3, passing: 3, setting: 3, attacking: 3, blocking: 3,
});

/**
 * Calcula a soma dos fundamentos para um time de jogadores.
 * @param players - Array de jogadores no time.
 * @returns Um objeto PlayerFundamentals com a soma de cada atributo.
 */
const calculateTeamFundamentals = (players: Player[]): PlayerFundamentals => {
  const teamFundamentals: PlayerFundamentals = { serve: 1, passing: 1, setting: 1, attacking: 1, blocking: 1 };
  players.forEach(player => {
    const pFunds = player.fundamentals ?? getDefaultFundamentals();
    for (const key in pFunds) {
      teamFundamentals[key as keyof PlayerFundamentals] += pFunds[key as keyof PlayerFundamentals];
    }
  });
  return teamFundamentals;
};

/**
 * Calcula o "custo" ou "desequilíbrio" total entre uma lista de times.
 * A métrica é a soma das diferenças absolutas de cada fundamento entre os times.
 * @param teams - Um array de times (apenas a lista de jogadores é necessária).
 * @returns Um número que representa o desequilíbrio total. Quanto menor, mais equilibrado.
 */
const calculateTotalImbalance = (teams: { players: Player[] }[]): number => {
  if (teams.length < 2) return 0;

  const teamFundamentals = teams.map(t => calculateTeamFundamentals(t.players));
  let totalDifference = 0;

  // Compara cada time com todos os outros times
  for (let i = 0; i < teamFundamentals.length; i++) {
    for (let j = i + 1; j < teamFundamentals.length; j++) {
      const fundamentalsA = teamFundamentals[i];
      const fundamentalsB = teamFundamentals[j];
      totalDifference += Math.abs(fundamentalsA.serve - fundamentalsB.serve);
      totalDifference += Math.abs(fundamentalsA.passing - fundamentalsB.passing);
      totalDifference += Math.abs(fundamentalsA.setting - fundamentalsB.setting);
      totalDifference += Math.abs(fundamentalsA.attacking - fundamentalsB.attacking);
      totalDifference += Math.abs(fundamentalsA.blocking - fundamentalsB.blocking);
    }
  }
  return totalDifference;
};


function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- Definição do Store Zustand ---
interface GameState {
  teamSize: TeamSize;
  teams: Team[];
  matchHistory: Match[];
  winnerIndex: number | null;
  balanceMode: 'level' | 'winrate' | 'fundamentals'; // Adicionado novo modo
  displayedBalanceMode: 'level' | 'winrate' | 'fundamentals';
  showCourtView: boolean;
  leftoverPlayerIds: string[];
  playersWhoJustEnteredIds: Set<string>;

  // Ações
  setTeamSize: (size: TeamSize) => void;
  setWinnerIndex: (index: number | null) => void;
  setBalanceMode: (mode: 'level' | 'winrate' | 'fundamentals') => void;
  setShowCourtView: (show: boolean) => void;
  addMatch: (match: Match) => void;
  deleteAllMatches: () => void;
  loadMatchHistory: () => Promise<void>;
  drawTeams: (sessionPlayers: Player[]) => void;
  endMatchAndSubstitute: () => void;
  deleteMatch: (matchId: string) => void;
  deleteMatchesByDate: (dateTitle: string) => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    teamSize: 6,
    teams: [],
    matchHistory: [],
    winnerIndex: null,
    balanceMode: 'fundamentals', // Modo padrão agora é por fundamentos
    displayedBalanceMode: 'fundamentals',
    showCourtView: true,
    leftoverPlayerIds: [],
    playersWhoJustEnteredIds: new Set(),

    setTeamSize: (size) => set({ teamSize: size }),
    setWinnerIndex: (index) => set({ winnerIndex: index }),
    setBalanceMode: (mode) => set({ balanceMode: mode }),
    setShowCourtView: (show) => set({ showCourtView: show }),
    addMatch: (match) => set((state) => ({ matchHistory: [match, ...state.matchHistory] })),
    deleteAllMatches: () => set({ matchHistory: [] }),

    loadMatchHistory: async () => {
      const history = await loadMatchHistory();
      set({ matchHistory: history });
    },

    deleteMatch: (matchId) => set((state) => ({
      matchHistory: state.matchHistory.filter(m => m.id !== matchId)
    })),

    deleteMatchesByDate: (dateTitle) => set((state) => ({
      matchHistory: state.matchHistory.filter(match => {
        const matchDate = new Date(match.date).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });
        return matchDate !== dateTitle;
      })
    })),

    // --- NOVA FUNÇÃO DRAWTEAMS ---
    drawTeams: (sessionPlayers) => {
      const { teamSize, balanceMode, matchHistory } = get();
      const activePlayers = sessionPlayers.filter((p: Player) => p.active);

      if (activePlayers.length < 2) {
        set({ teams: [], leftoverPlayerIds: sessionPlayers.map((p: Player) => p.id) });
        return;
      }
      
      const numPlayersToDraw = Math.floor(activePlayers.length / teamSize) * teamSize;
      const playersForTeams = shuffleArray(activePlayers).slice(0, numPlayersToDraw);
      const drawnPlayerIds = new Set(playersForTeams.map((p: Player) => p.id));
      const leftoverPlayers = sessionPlayers.filter((p: Player) => !drawnPlayerIds.has(p.id));
      const numTeams = Math.floor(playersForTeams.length / teamSize);

      if (numTeams === 0) {
        set({ teams: [], leftoverPlayerIds: sessionPlayers.map((p: Player) => p.id) });
        return;
      }

      let finalTeams: Team[] = [];

      // --- LÓGICA ANTIGA PARA 'level' E 'winrate' ---
      if (balanceMode === 'level' || balanceMode === 'winrate') {
        let sortedPlayers;
        if (balanceMode === 'winrate') {
          sortedPlayers = [...playersForTeams].sort((a, b) => (calculatePlayerStats(b.id, matchHistory).winRate ?? 50) - (calculatePlayerStats(a.id, matchHistory).winRate ?? 50));
        } else {
          sortedPlayers = [...playersForTeams].sort((a, b) => b.weight - a.weight);
        }
        
        const teams: Player[][] = Array.from({ length: numTeams }, () => []);
        for (let i = 0; i < sortedPlayers.length; i++) {
          const teamIndex = i % numTeams;
          const isEvenRow = Math.floor(i / numTeams) % 2 === 0;
          const targetTeam = isEvenRow ? teams[teamIndex] : teams[numTeams - 1 - teamIndex];
          targetTeam.push(sortedPlayers[i]);
        }
        
        finalTeams = teams.map(teamPlayers => {
          const total = teamPlayers.reduce((sum, p) => sum + (balanceMode === 'winrate' ? (calculatePlayerStats(p.id, matchHistory).winRate ?? 50) : p.weight), 0);
          return { players: teamPlayers, total, fundamentals: calculateTeamFundamentals(teamPlayers) };
        });

      // --- NOVA LÓGICA DE OTIMIZAÇÃO PARA 'fundamentals' ---
      } else {
        // 1. Cria a combinação inicial aleatória
        let bestCombination: Player[][] = Array.from({ length: numTeams }, () => []);
        playersForTeams.forEach((player, i) => {
          bestCombination[i % numTeams].push(player);
        });

        let bestImbalance = calculateTotalImbalance(bestCombination.map((p: Player[]) => ({ players: p })));

        // 2. Loop de otimização para encontrar a melhor combinação
        const maxIterations = 2500; // Aumentar para mais precisão, diminuir para mais velocidade
        for (let i = 0; i < maxIterations; i++) {
          if (bestImbalance === 0) break; // Já está perfeito

          // Escolhe dois times aleatórios para tentar uma troca
          const team1Index = Math.floor(Math.random() * numTeams);
          let team2Index = Math.floor(Math.random() * numTeams);
          while (team1Index === team2Index) {
            team2Index = Math.floor(Math.random() * numTeams);
          }

          // Escolhe um jogador aleatório de cada time
          const player1Index = Math.floor(Math.random() * bestCombination[team1Index].length);
          const player2Index = Math.floor(Math.random() * bestCombination[team2Index].length);

          // Cria uma cópia temporária da combinação para testar a troca
          // ✅ FIX: Explicitly type the result of JSON.parse to avoid 'any' type
          const tempCombination: Player[][] = JSON.parse(JSON.stringify(bestCombination));
          const player1 = tempCombination[team1Index][player1Index];
          const player2 = tempCombination[team2Index][player2Index];

          // Realiza a troca na cópia temporária
          tempCombination[team1Index][player1Index] = player2;
          tempCombination[team2Index][player2Index] = player1;

          // Calcula o desequilíbrio da nova combinação
          const newImbalance = calculateTotalImbalance(tempCombination.map((p: Player[]) => ({ players: p })));

          // Se a troca melhorou o equilíbrio, a aceita como a nova melhor combinação
          if (newImbalance < bestImbalance) {
            bestImbalance = newImbalance;
            bestCombination = tempCombination;
          }
        }
        
        // 3. Formata a melhor combinação encontrada para o estado do store
        finalTeams = bestCombination.map((teamPlayers: Player[]) => {
          const fundamentals = calculateTeamFundamentals(teamPlayers);
          const total = Object.values(fundamentals).reduce((sum, val) => sum + val, 0);
          return { players: teamPlayers, total, fundamentals };
        });
      }

      set({
        teams: finalTeams,
        winnerIndex: null,
        displayedBalanceMode: balanceMode,
        leftoverPlayerIds: leftoverPlayers.map((p: Player) => p.id),
      });
    },

    endMatchAndSubstitute: () => {
        // (Esta função permanece a mesma)
        const { teams, winnerIndex, leftoverPlayerIds, playersWhoJustEnteredIds, addMatch } = get();
        const { substitutePlayers } = usePlayersStore.getState();
  
        if (winnerIndex === null) return;
  
        addMatch({
          id: new Date().toISOString(),
          date: new Date().toISOString(),
          teams: teams,
          winnerTeamIndex: winnerIndex,
        });
  
        const playersToEnterIds = leftoverPlayerIds;
        if (playersToEnterIds.length === 0) {
          set({ teams: [], winnerIndex: null, playersWhoJustEnteredIds: new Set() });
          return;
        }
  
        const losingTeam = teams[winnerIndex === 0 ? 1 : 0];
        const eligibleToLeaveIds = losingTeam.players
          .map((p: Player) => p.id)
          .filter(id => !playersWhoJustEnteredIds.has(id));
  
        if (eligibleToLeaveIds.length < playersToEnterIds.length) {
          Alert.alert("Não é possível substituir", "O time perdedor não tem jogadores suficientes que possam sair.");
          set({ teams: [], winnerIndex: null, playersWhoJustEnteredIds: new Set() });
          return;
        }
        
        const playersToLeaveIds = shuffleArray(eligibleToLeaveIds).slice(0, playersToEnterIds.length);
  
        substitutePlayers(playersToLeaveIds, playersToEnterIds);
  
        set({
          leftoverPlayerIds: playersToLeaveIds,
          playersWhoJustEnteredIds: new Set(playersToEnterIds),
          teams: [],
          winnerIndex: null,
        });
    },
  }))
);

useGameStore.subscribe(
  (state) => state.matchHistory,
  (matchHistory) => {
    if (!usePlayersStore.getState().isLoading) {
      saveMatchHistory(matchHistory);
    }
  }
);
