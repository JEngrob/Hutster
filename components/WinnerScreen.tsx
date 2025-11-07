'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface WinnerScreenProps {
  winnerName?: string;
}

export default function WinnerScreen({ winnerName }: WinnerScreenProps) {
  useEffect(() => {
    if (winnerName) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      // Additional bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
      }, 250);
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);
    }
  }, [winnerName]);

  if (!winnerName) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Ingen vinder denne gang
        </h2>
        <p className="text-gray-600">
          Alle spillere blev elimineret
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-lg shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-4xl font-bold text-white mb-2">
        Tillykke!
      </h2>
      <p className="text-2xl font-semibold text-white mb-4">
        {winnerName}
      </p>
      <p className="text-white/90 text-lg">
        Du er vinderen!
      </p>
    </div>
  );
}



