export interface Player {
  id: string;
  name: string;
  isActive: boolean;
  currentGuess?: number;
}

export interface GameState {
  roomId: string;
  hostId: string;
  players: Map<string, Player>;
  state: 'lobby' | 'playing' | 'round-results' | 'finished';
  startYear?: number;
  timeline: number[]; // Sorted array of years
  currentRound: number;
  correctYear?: number;
  guesses: Map<string, number>; // playerId -> year guess
  winner?: string;
}

export interface Room {
  gameState: GameState;
  createdAt: number;
  lastActivity: number;
}

