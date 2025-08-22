export type Player = {
  id: string;
  name: string;
  active: boolean;
  weight: 1 | 2 | 3;
};

export type Team = {
  names: string[];
  total: number;
};

export type Screen = 'edit' | 'draw' | 'settings';

export type TeamSize = 2 | 3 | 4 | 5 | 6;