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

// Returns the current consecutive win streak for the given player
// Note: matchHistory is stored in descending order (index 0 is most recent)
export function getCurrentWinStreak(playerId: string, matchHistory: Match[]): number {
  if (!playerId || !Array.isArray(matchHistory) || matchHistory.length === 0) return 0;

  let streak = 0;

  for (let i = 0; i < matchHistory.length; i++) {
    const match = matchHistory[i];
    let participated = false;
    let playerTeamIndex = -1;

    for (let idx = 0; idx < match.teams.length; idx++) {
      if (match.teams[idx].players.some(p => p.id === playerId)) {
        participated = true;
        playerTeamIndex = idx;
        break;
      }
    }

    if (!participated) continue; // Ignore matches where player didn't play

    if (playerTeamIndex === match.winnerTeamIndex) {
      streak += 1;
    } else {
      break; // Streak broken on first loss
    }
  }

  return streak;
}