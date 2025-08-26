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