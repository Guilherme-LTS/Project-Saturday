import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Player, PlayerFundamentals } from '../types';
import { loadPlayers, loadSelectedPlayerIds, savePlayers, saveSelectedPlayerIds } from '../utils/storage';

interface PlayersState {
  allPlayers: Player[];
  selectedPlayerIds: Set<string>;
  isLoading: boolean;
  
  // Actions
  setAllPlayers: (players: Player[]) => void;
  addPlayers: (players: Player[]) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  deletePlayer: (playerId: string) => void;
  togglePlayerSelection: (playerId: string) => void;
  togglePlayerActive: (playerId: string) => void;
  setSelectedPlayerIds: (ids: Set<string>) => void;
  loadInitialData: () => Promise<void>;
  deleteAllPlayers: () => void;
  substitutePlayers: (idsToDeactivate: string[], idsToActivate: string[]) => void;
}

export const usePlayersStore = create<PlayersState>()(
  subscribeWithSelector((set, get) => ({
    allPlayers: [],
    selectedPlayerIds: new Set(),
    isLoading: true,

    setAllPlayers: (players) => set({ allPlayers: players }),
    
    addPlayers: (newPlayers) => set((state) => ({
      allPlayers: [...state.allPlayers, ...newPlayers],
      selectedPlayerIds: new Set([...state.selectedPlayerIds, ...newPlayers.map(p => p.id)])
    })),
    
    updatePlayer: (playerId, updates) => set((state) => ({
      allPlayers: state.allPlayers.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      )
    })),
    
    deletePlayer: (playerId) => set((state) => {
      const newSelectedIds = new Set(state.selectedPlayerIds);
      newSelectedIds.delete(playerId);
      return {
        allPlayers: state.allPlayers.filter(p => p.id !== playerId),
        selectedPlayerIds: newSelectedIds
      };
    }),
    
    togglePlayerSelection: (playerId) => set((state) => {
      const newSet = new Set(state.selectedPlayerIds);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return { selectedPlayerIds: newSet };
    }),
    
    togglePlayerActive: (playerId) => set((state) => ({
      allPlayers: state.allPlayers.map(p =>
        p.id === playerId ? { ...p, active: !p.active } : p
      )
    })),
    
    setSelectedPlayerIds: (ids) => set({ selectedPlayerIds: ids }),
    
    loadInitialData: async () => {
      const players = await loadPlayers();
      const selectedIds = await loadSelectedPlayerIds();
      set({ 
        allPlayers: players, 
        selectedPlayerIds: selectedIds, 
        isLoading: false 
      });
    },
    
    deleteAllPlayers: () => set({
      allPlayers: [],
      selectedPlayerIds: new Set()
    }),
    
    substitutePlayers: (idsToDeactivate, idsToActivate) => set((state) => ({
      allPlayers: state.allPlayers.map(player => {
        if (idsToDeactivate.includes(player.id)) {
          return { ...player, active: false };
        }
        if (idsToActivate.includes(player.id)) {
          return { ...player, active: true };
        }
        return player;
      })
    })),

    updatePlayerPhoto: (playerId: string, photoUri: string | null) => {
      set((state) => ({
        allPlayers: state.allPlayers.map(player =>
          player.id === playerId 
            ? { ...player, photoUri: photoUri || undefined }
            : player
        ),
      }));
    },

    removePlayerPhoto: (playerId: string) => {
      set((state) => ({
        allPlayers: state.allPlayers.map(player =>
          player.id === playerId 
            ? { ...player, photoUri: undefined }
            : player
        ),
      }));
    },

    updatePlayerFundamentals: (playerId: string, fundamentals: PlayerFundamentals) => set((state) => ({
      allPlayers: state.allPlayers.map(p => 
        p.id === playerId ? { ...p, fundamentals } : p
      )
    })),
  }))
);

// Auto-save subscriptions
usePlayersStore.subscribe(
  (state) => state.allPlayers,
  (allPlayers) => {
    if (!usePlayersStore.getState().isLoading) {
      savePlayers(allPlayers);
    }
  }
);

usePlayersStore.subscribe(
  (state) => state.selectedPlayerIds,
  (selectedPlayerIds) => {
    if (!usePlayersStore.getState().isLoading) {
      saveSelectedPlayerIds(selectedPlayerIds);
    }
  }
);