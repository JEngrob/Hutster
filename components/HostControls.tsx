'use client';

import { useState } from 'react';

interface HostControlsProps {
  onStartGame: (startYear: number) => void;
  onSubmitAnswer: (correctYear: number) => void;
  onNextRound: () => void;
  onReset: (keepPlayers: boolean) => void;
  gameState: 'lobby' | 'playing' | 'round-results' | 'finished';
  currentRound: number;
}

export default function HostControls({
  onStartGame,
  onSubmitAnswer,
  onNextRound,
  onReset,
  gameState,
  currentRound,
}: HostControlsProps) {
  const [startYear, setStartYear] = useState('');
  const [correctYear, setCorrectYear] = useState('');

  if (gameState === 'lobby') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Start spil</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startårstal
            </label>
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="f.eks. 1995"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              const year = parseInt(startYear);
              if (year > 1900 && year < 2100) {
                onStartGame(year);
                setStartYear('');
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start spil
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Runde {currentRound}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Korrekt udgivelsesår
            </label>
            <input
              type="number"
              value={correctYear}
              onChange={(e) => setCorrectYear(e.target.value)}
              placeholder="f.eks. 1989"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              const year = parseInt(correctYear);
              if (year > 1900 && year < 2100) {
                onSubmitAnswer(year);
                setCorrectYear('');
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Indsend svar
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'round-results') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={onNextRound}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-3"
        >
          Næste runde
        </button>
        <button
          onClick={() => onReset(true)}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Nulstil spil
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Spil afsluttet</h3>
      <p className="text-sm text-gray-600 mb-4">Vil du bevare spillere eller starte helt forfra?</p>
      <div className="space-y-3">
        <button
          onClick={() => onReset(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Bevar spillere
        </button>
        <button
          onClick={() => onReset(false)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start helt forfra
        </button>
      </div>
    </div>
  );
}

