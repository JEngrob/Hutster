'use client';

interface Player {
  id: string;
  name: string;
  isActive: boolean;
  currentGuess?: number;
}

interface PlayerListProps {
  players: Player[];
  showGuesses?: boolean;
  guesses?: { playerId: string; year: number }[];
  gameState?: 'lobby' | 'playing' | 'round-results' | 'finished';
}

export default function PlayerList({ players, showGuesses = false, guesses = [], gameState = 'lobby' }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        Ingen spillere endnu
      </div>
    );
  }

  // Check if player has submitted a guess
  const hasSubmittedGuess = (playerId: string) => {
    return guesses.some(g => g.playerId === playerId);
  };

  return (
    <div className="space-y-2">
      {players.map((player) => {
        const hasGuess = hasSubmittedGuess(player.id);
        const isPlaying = gameState === 'playing' && player.isActive;
        
        return (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              player.isActive
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-100 border border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                player.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
              <span className={`font-medium ${
                player.isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isPlaying && (
                <span className={`text-xs font-semibold ${
                  hasGuess ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {hasGuess ? '✓ Gæt afgivet' : '⏳ Venter'}
                </span>
              )}
              {showGuesses && player.currentGuess !== undefined && (
                <span className="text-sm text-gray-600 font-mono">
                  {player.currentGuess}
                </span>
              )}
              {!player.isActive && (
                <span className="text-xs text-red-600 font-semibold">UDE</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}



