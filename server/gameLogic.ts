import { GameState, Player } from './types';

/**
 * Validates if a player's guess is correct based on the timeline
 * Returns true if the guess is in the correct position relative to existing years
 */
export function validateGuess(guess: number, timeline: number[], correctYear: number, startYear?: number): boolean {
  // First round: compare with start year
  if (timeline.length === 1 && startYear !== undefined) {
    // Check if guess and correctYear are on the same side of startYear
    const guessBeforeStart = guess < startYear;
    const correctBeforeStart = correctYear < startYear;
    return guessBeforeStart === correctBeforeStart;
  }

  // Subsequent rounds: check if guess is in the same "slot" as correctYear
  const correctPosition = getPositionRelativeToTimeline(correctYear, timeline);
  const guessPosition = getPositionRelativeToTimeline(guess, timeline);
  
  // If both are exact matches to the same year, they're equal
  if (correctPosition === 'exact' && guessPosition === 'exact') {
    return correctYear === guess;
  }
  
  return correctPosition === guessPosition;
}

/**
 * Determines the position of a year relative to the timeline
 * Returns: 'before' | 'between' | 'after' | 'exact'
 */
function getPositionRelativeToTimeline(year: number, timeline: number[]): string {
  if (timeline.length === 0) return 'before';
  
  const sorted = [...timeline].sort((a, b) => a - b);
  
  if (year < sorted[0]) return 'before';
  if (year > sorted[sorted.length - 1]) return 'after';
  
  // Check if it's between any two years
  for (let i = 0; i < sorted.length - 1; i++) {
    if (year > sorted[i] && year < sorted[i + 1]) {
      return 'between';
    }
  }
  
  // Check if it matches exactly
  if (sorted.includes(year)) return 'exact';
  
  return 'between';
}

/**
 * Inserts a year into the timeline in chronological order
 * Prevents duplicates - if year already exists, returns timeline unchanged
 */
export function insertYearIntoTimeline(year: number, timeline: number[]): number[] {
  // Check if year already exists in timeline
  if (timeline.includes(year)) {
    return timeline; // Return unchanged if duplicate
  }
  
  const newTimeline = [...timeline, year];
  return newTimeline.sort((a, b) => a - b);
}

/**
 * Evaluates all guesses and marks players as inactive if they guessed wrong
 */
export function evaluateGuesses(gameState: GameState): { eliminated: string[], active: string[] } {
  const eliminated: string[] = [];
  const active: string[] = [];
  
  if (!gameState.correctYear) {
    return { eliminated, active };
  }
  
  gameState.players.forEach((player, playerId) => {
    if (!player.isActive) {
      return; // Already eliminated
    }
    
    const guess = gameState.guesses.get(playerId);
    if (guess === undefined) {
      // No guess submitted - eliminate
      eliminated.push(playerId);
      player.isActive = false;
      return;
    }
    
    const isValid = validateGuess(guess, gameState.timeline, gameState.correctYear!, gameState.startYear);
    
    if (isValid) {
      active.push(playerId);
    } else {
      eliminated.push(playerId);
      player.isActive = false;
    }
  });
  
  return { eliminated, active };
}

/**
 * Checks if game should end (only one or zero active players left)
 */
export function checkGameEnd(gameState: GameState): boolean {
  const activePlayers = Array.from(gameState.players.values()).filter(p => p.isActive);
  
  if (activePlayers.length <= 1) {
    gameState.winner = activePlayers.length === 1 ? activePlayers[0].id : undefined;
    gameState.state = 'finished';
    return true;
  }
  
  return false;
}

