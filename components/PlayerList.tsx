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
}

export default function PlayerList({ players, showGuesses = false }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        Ingen spillere endnu
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
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
          {showGuesses && player.currentGuess !== undefined && (
            <span className="text-sm text-gray-600 font-mono">
              {player.currentGuess}
            </span>
          )}
          {!player.isActive && (
            <span className="text-xs text-red-600 font-semibold">UDE</span>
          )}
        </div>
      ))}
    </div>
  );
}

