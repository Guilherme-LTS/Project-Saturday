// types/index.ts (versão final)
export type Player = {
  id: string;
  name: string;
  active: boolean;
  weight: 1 | 2 | 3;
  photoUri?: string;
};

export type Team = {
  players: Player[]; // A propriedade correta é 'players'
  total: number;
};

export type Screen = 'edit' | 'draw' | 'players' | 'settings' | 'history';

export type TeamSize = number;

export type Match = {
  id: string;
  date: string;
  teams: Team[];
  winnerTeamIndex: number;
};

export type SortMode = 'alphabetical' | 'level' | 'winrate' | 'session';