// utils/historyFilterUtils.ts

import { Match } from '../types';

export interface HistoryFilter {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  type: 'together' | 'against'; // together = same team, against = opposing teams
}

/**
 * Filters match history based on player relationship filters
 * @param matches - Array of matches to filter
 * @param filters - Array of filters to apply
 * @returns Filtered array of matches
 */
export function filterMatchHistory(matches: Match[], filters: HistoryFilter[]): Match[] {
  if (!filters || filters.length === 0) {
    return matches;
  }

  // Only consider filters that have both players selected
  const validFilters = filters.filter(f => f.player1Id && f.player2Id);
  
  if (validFilters.length === 0) {
    return matches;
  }

  return matches.filter(match => {
    // All filters must be satisfied (AND logic)
    return validFilters.every(filter => {
      const { player1Id, player2Id, type } = filter;
      
      if (!player1Id || !player2Id) return true; // Skip invalid filters
      
      return matchSatisfiesFilter(match, player1Id, player2Id, type);
    });
  });
}

/**
 * Checks if a single match satisfies a filter condition
 * @param match - The match to check
 * @param player1Id - First player ID
 * @param player2Id - Second player ID
 * @param type - Filter type ('together' or 'against')
 * @returns Boolean indicating if the match satisfies the filter
 */
function matchSatisfiesFilter(
  match: Match, 
  player1Id: string, 
  player2Id: string, 
  type: 'together' | 'against'
): boolean {
  // Find which teams each player is on
  let player1TeamIndex = -1;
  let player2TeamIndex = -1;

  match.teams.forEach((team, teamIndex) => {
    const hasPlayer1 = team.players.some(p => p.id === player1Id);
    const hasPlayer2 = team.players.some(p => p.id === player2Id);

    if (hasPlayer1) player1TeamIndex = teamIndex;
    if (hasPlayer2) player2TeamIndex = teamIndex;
  });

  // Both players must be in the match
  if (player1TeamIndex === -1 || player2TeamIndex === -1) {
    return false;
  }

  // Apply filter logic
  if (type === 'together') {
    // Players should be on the same team
    return player1TeamIndex === player2TeamIndex;
  } else if (type === 'against') {
    // Players should be on different teams
    return player1TeamIndex !== player2TeamIndex;
  }

  return false;
}

/**
 * Gets statistics about filter results
 * @param originalCount - Original number of matches
 * @param filteredCount - Number of matches after filtering
 * @param filters - Applied filters
 * @returns Statistics object
 */
export function getFilterStats(
  originalCount: number, 
  filteredCount: number, 
  filters: HistoryFilter[]
): {
  originalCount: number;
  filteredCount: number;
  filtersApplied: number;
  percentageShown: number;
} {
  const validFilters = filters.filter(f => f.player1Id && f.player2Id);
  
  return {
    originalCount,
    filteredCount,
    filtersApplied: validFilters.length,
    percentageShown: originalCount === 0 ? 0 : Math.round((filteredCount / originalCount) * 100)
  };
}

/**
 * Creates a human-readable description of active filters
 * @param filters - Array of filters
 * @param getPlayerName - Function to get player name by ID
 * @returns Array of filter descriptions
 */
export function getFilterDescriptions(
  filters: HistoryFilter[],
  getPlayerName: (playerId: string) => string
): string[] {
  return filters
    .filter(f => f.player1Id && f.player2Id)
    .map(filter => {
      const player1Name = getPlayerName(filter.player1Id!);
      const player2Name = getPlayerName(filter.player2Id!);
      const relationship = filter.type === 'together' ? 'jogaram juntos' : 'jogaram contra';
      
      return `${player1Name} e ${player2Name} ${relationship}`;
    });
}

/**
 * Checks if any filters are currently active
 * @param filters - Array of filters to check
 * @returns Boolean indicating if there are active filters
 */
export function hasActiveFilters(filters: HistoryFilter[]): boolean {
  return filters.some(f => f.player1Id && f.player2Id);
}