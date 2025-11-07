'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Socket } from 'socket.io-client';

type PlayerState = 'join' | 'waiting' | 'guessing' | 'result' | 'spectating';

export default function PlayerPage() {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<PlayerState>('join');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<number[]>([]);
  const [startYear, setStartYear] = useState<number | undefined>();
  const [currentRound, setCurrentRound] = useState(0);
  const [guess, setGuess] = useState('');
  const [submittedGuess, setSubmittedGuess] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<{
    guess?: number;
    correctYear: number;
    isEliminated: boolean;
    isWinner: boolean;
  } | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJoined = (data: { roomId: string; playerName: string }) => {
      setState('waiting');
      setError(null);
    };

    const handleJoinError = (data: { message: string }) => {
      setError(data.message);
    };

    const handleGameStarted = (data: { startYear: number; round: number }) => {
      setState('guessing');
      setStartYear(data.startYear);
      setTimeline([data.startYear]);
      setCurrentRound(data.round);
      setGuess('');
      setSubmittedGuess(null);
      setRoundResult(null);
      setError(null); // Clear error when game starts
    };

    const handleGuessSubmitted = (data: { year: number }) => {
      setSubmittedGuess(data.year);
    };

    const handleRoundResult = (data: {
      guess?: number;
      correctYear: number;
      isEliminated: boolean;
      isWinner: boolean;
    }) => {
      setRoundResult(data);
      setState(data.isEliminated ? 'spectating' : 'result');
    };

    const handleNextRound = (data: { round: number; timeline: number[] }) => {
      if (state !== 'spectating') {
        setState('guessing');
      }
      setCurrentRound(data.round);
      setTimeline(data.timeline);
      setGuess('');
      setSubmittedGuess(null);
      setRoundResult(null);
      setError(null); // Clear error when next round starts
    };

    const handleError = (data: { message: string }) => {
      setError(data.message || 'Der opstod en fejl');
    };

    socket.on('player:joined', handleJoined);
    socket.on('player:join-error', handleJoinError);
    socket.on('game:started', handleGameStarted);
    socket.on('player:guess-submitted', handleGuessSubmitted);
    socket.on('player:round-result', handleRoundResult);
    socket.on('game:next-round', handleNextRound);
    socket.on('error', handleError);

    return () => {
      socket.off('player:joined', handleJoined);
      socket.off('player:join-error', handleJoinError);
      socket.off('game:started', handleGameStarted);
      socket.off('player:guess-submitted', handleGuessSubmitted);
      socket.off('player:round-result', handleRoundResult);
      socket.off('game:next-round', handleNextRound);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, state]);

  const handleJoin = () => {
    if (!socket || !roomId.trim() || !playerName.trim()) {
      setError('Udfyld begge felter');
      return;
    }

    // Validate room ID format (6 alphanumeric characters)
    const trimmedRoomId = roomId.toUpperCase().trim();
    if (!/^[A-Z0-9]{6}$/.test(trimmedRoomId)) {
      setError('Ugyldig spil-kode. Skal være 6 tegn.');
      return;
    }

    // Validate and sanitize player name
    const trimmedName = playerName.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      setError('Navn skal være mellem 1 og 50 tegn');
      return;
    }

    setError(null);
    socket.emit('player:join', { roomId: trimmedRoomId, playerName: trimmedName });
  };

  const handleSubmitGuess = () => {
    if (!socket || !guess.trim()) {
      return;
    }

    const year = parseInt(guess);
    if (year < 1900 || year > 2100) {
      setError('Ugyldigt årstal');
      return;
    }

    setError(null); // Clear error when submitting valid guess
    socket.emit('player:submit-guess', { roomId, year });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Forbinder til server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Join Screen */}
        {state === 'join' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hitster Online
            </h1>
            <p className="text-gray-600 text-center mb-6">Join et spil</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spil-kode
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-mono tracking-wider uppercase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dit navn
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Skriv dit navn"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoin}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Join spil
              </button>
            </div>
          </div>
        )}

        {/* Waiting Screen */}
        {state === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Velkommen, {playerName}!</h2>
            <div className="animate-pulse text-purple-600 text-6xl mb-4">🎵</div>
            <p className="text-gray-600">Venter på at værten starter spillet...</p>
          </div>
        )}

        {/* Guessing Screen */}
        {state === 'guessing' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-center mb-2">Runde {currentRound}</h2>
            <p className="text-center text-gray-600 mb-6">Hej, {playerName}!</p>

            {submittedGuess === null ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hvornår udkom sangen?
                  </label>
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => {
                      setGuess(e.target.value);
                      setError(null); // Clear error when user starts typing
                    }}
                    placeholder="f.eks. 1989"
                    min="1900"
                    max="2100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmitGuess}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Indsend gæt
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">Dit gæt: {submittedGuess}</p>
                <p className="text-sm text-gray-500 mt-2">Venter på andre spillere...</p>
              </div>
            )}
          </div>
        )}

        {/* Result Screen */}
        {state === 'result' && roundResult && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Du gik videre!</h2>
            <p className="text-gray-600 mb-4">
              Dit gæt: {roundResult.guess}
            </p>
            <p className="text-gray-600 mb-4">
              Korrekt år: {roundResult.correctYear}
            </p>
            <p className="text-sm text-gray-500 mt-4">Venter på næste runde...</p>
          </div>
        )}

        {/* Spectating Screen */}
        {state === 'spectating' && roundResult && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Du er ude</h2>
            <p className="text-gray-600 mb-4">
              Dit gæt: {roundResult.guess}
            </p>
            <p className="text-gray-600 mb-4">
              Korrekt år: {roundResult.correctYear}
            </p>
            <p className="text-sm text-gray-500 mt-4">Du kan stadig følge med i spillet</p>
          </div>
        )}
      </div>
    </div>
  );
}

