// types/index.ts (versão final)

export type PlayerFundamentals = {
  serve: 1 | 2 | 3 | 4 | 5;
  passing: 1 | 2 | 3 | 4 | 5;
  setting: 1 | 2 | 3 | 4 | 5;
  attacking: 1 | 2 | 3 | 4 | 5;
  blocking: 1 | 2 | 3 | 4 | 5;
};

export type Player = {
  id: string;
  name: string;
  active: boolean;
  weight: 1 | 2 | 3;
  photoUri?: string;
  fundamentals?: PlayerFundamentals;
};

export type Team = {
  players: Player[];
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