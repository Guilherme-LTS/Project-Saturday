export type Player = {
  id: string;
  name: string;
  active: boolean;
  weight: 1 | 2 | 3;
  photoUri?: string;
};

export type Team = {
  names: string[];
  total: number;
};

export type Screen = 'edit' | 'draw' | 'players' | 'settings';

export type TeamSize = number;

export type Match = {
  id: string; // Usaremos a data como ID
  date: string; // Data da partida em formato de texto
  teams: Team[]; // Os times que jogaram
  winnerTeamIndex: number; // O índice do time vencedor no array 'teams'
};