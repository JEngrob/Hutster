'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import Timeline from '@/components/Timeline';
import PlayerList from '@/components/PlayerList';
import HostControls from '@/components/HostControls';
import WinnerScreen from '@/components/WinnerScreen';

interface Player {
  id: string;
  name: string;
  isActive: boolean;
  currentGuess?: number;
}

interface Guess {
  playerId: string;
  playerName: string;
  year: number;
}

interface GuessResult {
  playerId: string;
  playerName: string;
  guess?: number;
  isCorrect: boolean;
}

export default function HostPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { socket, isConnected } = useSocket();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'round-results' | 'finished'>('lobby');
  const [startYear, setStartYear] = useState<number | undefined>();
  const [timeline, setTimeline] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [guessResults, setGuessResults] = useState<GuessResult[]>([]);
  const [winner, setWinner] = useState<string | undefined>();
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    // Request initial player list
    socket.emit('host:request-player-list', { roomId });

    const handlePlayerList = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handleGameStarted = (data: { startYear: number; round: number }) => {
      setGameState('playing');
      setStartYear(data.startYear);
      setTimeline([data.startYear]);
      setCurrentRound(data.round);
      setGuesses([]);
      setGuessResults([]);
    };

    const handleGuessReceived = (data: Guess) => {
      setGuesses(prev => {
        const filtered = prev.filter(g => g.playerId !== data.playerId);
        return [...filtered, data];
      });
    };

    const handleRoundResults = (data: {
      correctYear: number;
      timeline: number[];
      eliminated: string[];
      active: string[];
      gameEnded: boolean;
      winner?: string;
      guessResults?: GuessResult[];
    }) => {
      setGameState(data.gameEnded ? 'finished' : 'round-results');
      setTimeline(data.timeline);
      setEliminated(data.eliminated);
      setActive(data.active);
      if (data.guessResults) {
        setGuessResults(data.guessResults);
      }
      if (data.gameEnded) {
        setWinner(data.winner);
      }
    };

    const handleNextRound = (data: { round: number; timeline: number[] }) => {
      setGameState('playing');
      setCurrentRound(data.round);
      setTimeline(data.timeline);
      setGuesses([]);
      setGuessResults([]);
      setEliminated([]);
      setActive([]);
    };

    const handleGameReset = (data: { players: Player[] }) => {
      setGameState('lobby');
      setPlayers(data.players.filter(p => p.name !== 'HOST_PLACEHOLDER'));
      setStartYear(undefined);
      setTimeline([]);
      setCurrentRound(0);
      setGuesses([]);
      setGuessResults([]);
      setWinner(undefined);
      setEliminated([]);
      setActive([]);
    };

    const handleError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
      // Could show error toast here if needed
    };

    socket.on('room:player-list', handlePlayerList);
    socket.on('game:started', handleGameStarted);
    socket.on('host:guess-received', handleGuessReceived);
    socket.on('game:round-results', handleRoundResults);
    socket.on('game:next-round', handleNextRound);
    socket.on('game:reset', handleGameReset);
    socket.on('error', handleError);
    socket.on('host:start-game-error', handleError);

    return () => {
      socket.off('room:player-list', handlePlayerList);
      socket.off('game:started', handleGameStarted);
      socket.off('host:guess-received', handleGuessReceived);
      socket.off('game:round-results', handleRoundResults);
      socket.off('game:next-round', handleNextRound);
      socket.off('game:reset', handleGameReset);
      socket.off('error', handleError);
      socket.off('host:start-game-error', handleError);
    };
  }, [socket, isConnected, roomId]);

  const handleStartGame = (year: number) => {
    if (socket && isConnected) {
      console.log('Starting game with year:', year, 'roomId:', roomId);
      socket.emit('host:start-game', { roomId, startYear: year });
    } else {
      console.error('Socket not connected');
    }
  };

  const handleSubmitAnswer = (correctYear: number) => {
    if (socket) {
      socket.emit('host:submit-answer', { roomId, correctYear });
    }
  };

  const handleNextRound = () => {
    if (socket) {
      socket.emit('host:next-round', { roomId });
    }
  };

  const handleReset = (keepPlayers: boolean) => {
    if (socket) {
      socket.emit('host:reset-game', { roomId, keepPlayers });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Forbinder til server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hitster Online - Vært
          </h1>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Spil-kode:</p>
            <p className="text-4xl font-mono font-bold text-purple-600 tracking-wider">
              {roomId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Del denne kode med spillere
            </p>
          </div>
        </div>

        {/* Winner Screen */}
        {gameState === 'finished' && (
          <div className="mb-6">
            <WinnerScreen winnerName={winner} />
          </div>
        )}

        {/* Timeline - Full Width */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tidslinje</h2>
          <Timeline years={timeline} startYear={startYear} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Host Controls */}
            <HostControls
              onStartGame={handleStartGame}
              onSubmitAnswer={handleSubmitAnswer}
              onNextRound={handleNextRound}
              onReset={handleReset}
              gameState={gameState}
              currentRound={currentRound}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Players */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Spillere ({players.length})
              </h2>
              <PlayerList 
                players={players} 
                showGuesses={false} 
                guesses={guesses}
                gameState={gameState}
              />
            </div>

            {/* Guesses Overview - Only show after answer is submitted */}
            {gameState === 'round-results' && guessResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Gæt</h2>
                <div className="space-y-2">
                  {guessResults.map((result) => (
                    <div
                      key={result.playerId}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        result.isCorrect
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-red-50 border border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="font-medium">{result.playerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.guess !== undefined ? (
                          <>
                            <span className="font-mono text-gray-700">{result.guess}</span>
                            <span className={`text-sm font-semibold ${
                              result.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.isCorrect ? '✓' : '✗'}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Ingen gæt</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Round Results */}
            {gameState === 'round-results' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Runde resultater</h2>
                {eliminated.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-red-600 mb-2">Elimineret:</p>
                    <div className="space-y-1">
                      {eliminated.map((name) => (
                        <p key={name} className="text-sm text-gray-700">• {name}</p>
                      ))}
                    </div>
                  </div>
                )}
                {active.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">Gik videre:</p>
                    <div className="space-y-1">
                      {active.map((name) => (
                        <p key={name} className="text-sm text-gray-700">• {name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

