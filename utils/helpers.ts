// utils/helpers.ts (versão atualizada)

import { Match } from '../types';

// Função agora retorna um objeto com mais estatísticas
export function calculatePlayerStats(playerId: string, matchHistory: Match[]): {
  gamesPlayed: number;
  winRate: number | null;
} {
  let gamesPlayed = 0;
  let gamesWon = 0;

  for (const match of matchHistory) {
    let playedInMatch = false;
    match.teams.forEach((team, index) => {
      if (team.players.some(p => p.id === playerId)) {
        playedInMatch = true;
        if (index === match.winnerTeamIndex) {
          gamesWon++;
        }
      }
    });
    if (playedInMatch) {
      gamesPlayed++;
    }
  }

  const winRate = gamesPlayed === 0 ? null : Math.round((gamesWon / gamesPlayed) * 100);

  // Retorna o objeto com ambos os valores
  return { gamesPlayed, winRate };
}

// Returns the current consecutive win streak for the given player (wins in most recent games until a loss or no game)
export function getCurrentWinStreak(playerId: string, matchHistory: Match[]): number {
  if (!playerId || !Array.isArray(matchHistory) || matchHistory.length === 0) return 0;

  // Sort by date ascending to ensure order, then iterate from latest to oldest
  const sorted = [...matchHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let streak = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const match = sorted[i];
    let participated = false;
    let playerTeamIndex = -1;
    match.teams.forEach((team, idx) => {
      if (team.players.some(p => p.id === playerId)) {
        participated = true;
        playerTeamIndex = idx;
      }
    });

    if (!participated) continue; // ignore matches where player didn't play

    const won = playerTeamIndex === match.winnerTeamIndex;
    if (won) streak += 1; else break;
  }

  return streak;
}