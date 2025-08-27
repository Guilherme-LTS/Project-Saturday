import { Alert } from 'react-native';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Match, Player, Team, TeamSize } from '../types';
import { calculatePlayerStats } from '../utils/helpers';
import { loadMatchHistory, saveMatchHistory } from '../utils/storage';
import { usePlayersStore } from './playersStore';

// --- Helper Functions ---
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- Zustand Store Definition ---
interface GameState {
  teamSize: TeamSize;
  teams: Team[];
  matchHistory: Match[];
  winnerIndex: number | null;
  balanceMode: 'level' | 'winrate';
  displayedBalanceMode: 'level' | 'winrate';
  showCourtView: boolean;
  leftoverPlayerIds: string[];
  playersWhoJustEnteredIds: Set<string>;

  // Actions
  setTeamSize: (size: TeamSize) => void;
  setWinnerIndex: (index: number | null) => void;
  setBalanceMode: (mode: 'level' | 'winrate') => void;
  setShowCourtView: (show: boolean) => void;
  addMatch: (match: Match) => void;
  deleteAllMatches: () => void;
  loadMatchHistory: () => Promise<void>;
  drawTeams: (sessionPlayers: Player[]) => void;
  endMatchAndSubstitute: () => void;
  // ✅ FIX: Add the delete actions back to the interface
  deleteMatch: (matchId: string) => void;
  deleteMatchesByDate: (dateTitle: string) => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    teamSize: 6,
    teams: [],
    matchHistory: [],
    winnerIndex: null,
    balanceMode: 'level',
    displayedBalanceMode: 'level',
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

    drawTeams: (sessionPlayers) => {
      const { teamSize, balanceMode, matchHistory } = get();
      const activePlayers = sessionPlayers.filter(p => p.active);

      if (activePlayers.length < 2) {
        set({ teams: [], leftoverPlayerIds: sessionPlayers.map(p => p.id) });
        return;
      }

      const shuffledPool = shuffleArray(activePlayers);

      let sortedPlayers;
      if (balanceMode === 'winrate') {
        sortedPlayers = [...shuffledPool].sort((a, b) => (calculatePlayerStats(b.id, matchHistory).winRate ?? 50) - (calculatePlayerStats(a.id, matchHistory).winRate ?? 50));
      } else {
        sortedPlayers = [...shuffledPool].sort((a, b) => b.weight - a.weight);
      }

      const numPlayersToDraw = Math.floor(sortedPlayers.length / teamSize) * teamSize;
      const playersForTeams = sortedPlayers.slice(0, numPlayersToDraw);
      const drawnPlayerIds = new Set(playersForTeams.map(p => p.id));
      
      const leftoverPlayers = sessionPlayers.filter(p => !drawnPlayerIds.has(p.id));

      const numTeams = Math.ceil(playersForTeams.length / teamSize);
      if (numTeams === 0) {
        set({ teams: [], leftoverPlayerIds: sessionPlayers.map(p => p.id) });
        return;
      }
      
      const teams: Player[][] = Array.from({ length: numTeams }, () => []);
      for (let i = 0; i < playersForTeams.length; i++) {
        const teamIndex = i % numTeams;
        const isEvenRow = Math.floor(i / numTeams) % 2 === 0;
        const targetTeam = isEvenRow ? teams[teamIndex] : teams[numTeams - 1 - teamIndex];
        targetTeam.push(playersForTeams[i]);
      }
      
      const finalTeams: Team[] = teams.map(teamPlayers => {
        const total = teamPlayers.reduce((sum, p) => sum + (balanceMode === 'winrate' ? (calculatePlayerStats(p.id, matchHistory).winRate ?? 50) : p.weight), 0);
        return { players: teamPlayers, total };
      });

      set({
        teams: finalTeams,
        winnerIndex: null,
        displayedBalanceMode: balanceMode,
        leftoverPlayerIds: leftoverPlayers.map(p => p.id),
      });
    },

    endMatchAndSubstitute: () => {
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
        .map(p => p.id)
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
 