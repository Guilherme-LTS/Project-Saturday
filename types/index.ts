// types/index.ts

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
  total: number; // Agora representa a soma total de todos os pontos de fundamento
  fundamentals: PlayerFundamentals; // Vetor com a soma dos fundamentos do time
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
