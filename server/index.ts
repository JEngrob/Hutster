import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  updateRoomActivity,
} from './roomManager';
import {
  evaluateGuesses,
  insertYearIntoTimeline,
  checkGameEnd,
} from './gameLogic';
import { GameState, Room } from './types';
import {
  sanitizePlayerName,
  validateRoomId,
  validateYear,
  checkRateLimit,
  RATE_LIMIT,
} from './security';

const app = express();

// Security middleware
app.use(express.json({ limit: '10kb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const httpServer = createServer(app);

// Determine CORS origin - use environment variable or allow all in production
// In Azure, we need to allow the Azure URL dynamically
const getCorsOrigin = () => {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  // In production/Azure, allow all origins (Socket.IO will validate)
  // This is safe because Socket.IO validates the origin
  if (process.env.NODE_ENV === 'production') {
    return true; // Allow all origins in production
  }
  // Development default
  return "http://localhost:3000";
};

const io = new Server(httpServer, {
  cors: {
    origin: getCorsOrigin(),
    methods: ["GET", "POST"],
    credentials: false, // Don't allow credentials
  },
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000,
  pingInterval: 25000,
  // Allow Socket.IO to work behind Azure's reverse proxy
  allowEIO3: true,
  // Enable connection state recovery for better reliability
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

const PORT = process.env.PORT || 3001;

/**
 * Validates if a socket is authorized to perform host actions
 * Also updates hostId if host reconnected
 */
function validateAndUpdateHost(room: Room, socketId: string): boolean {
  const isHost = room.gameState.hostId === socketId;
  
  // If already the host, allow
  if (isHost) {
    return true;
  }
  
  // Check if socket is in the room
  const isInRoom = io.sockets.adapter.rooms.get(room.gameState.roomId)?.has(socketId);
  
  // If socket is in room but not the host, check if this is a reconnection scenario
  // The host socket might have disconnected and reconnected with a new socket.id
  if (isInRoom) {
    // Check if the original host socket is still connected
    const originalHostSocket = io.sockets.sockets.get(room.gameState.hostId);
    if (!originalHostSocket || !originalHostSocket.connected) {
      // Original host disconnected, update to new socket
      room.gameState.hostId = socketId;
      return true;
    }
  }
  
  return false;
}

// Track rooms per socket for DoS protection
const socketRoomCount = new Map<string, number>();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize room count for this socket
  socketRoomCount.set(socket.id, 0);

  // Host creates a new game
  socket.on('host:create-game', () => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      socket.emit('error', { message: 'Too many requests. Please wait.' });
      return;
    }
    
    // Check max rooms per socket
    const currentRoomCount = socketRoomCount.get(socket.id) || 0;
    if (currentRoomCount >= RATE_LIMIT.MAX_ROOMS_PER_SOCKET) {
      socket.emit('error', { message: 'Maximum number of rooms reached' });
      return;
    }
    
    const roomId = createRoom(socket.id);
    socket.join(roomId);
    socketRoomCount.set(socket.id, currentRoomCount + 1);
    socket.emit('host:game-created', { roomId });
    console.log('Game created:', roomId);
  });

  // Host requests player list
  socket.on('host:request-player-list', ({ roomId }: { roomId: string }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('error', { message: 'Invalid room ID format' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room) {
      return;
    }
    
    // Verify host by checking if socket is in the room or is the creator
    socket.join(roomId);
    
    socket.emit('room:player-list', {
      players: Array.from(room.gameState.players.values()),
    });
  });

  // Player joins a game
  socket.on('player:join', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      socket.emit('player:join-error', { message: 'Too many requests. Please wait.' });
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('player:join-error', { message: 'Invalid room ID format' });
      return;
    }
    
    // Sanitize player name
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName || sanitizedName.length === 0) {
      socket.emit('player:join-error', { message: 'Invalid player name' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('player:join-error', { message: 'Room not found' });
      return;
    }

    if (room.gameState.state !== 'lobby') {
      socket.emit('player:join-error', { message: 'Game already started' });
      return;
    }
    
    // Check max players per room
    if (room.gameState.players.size >= RATE_LIMIT.MAX_PLAYERS_PER_ROOM) {
      socket.emit('player:join-error', { message: 'Room is full' });
      return;
    }

    addPlayerToRoom(roomId, socket.id, sanitizedName);
    socket.join(roomId);
    updateRoomActivity(roomId);

    socket.emit('player:joined', { roomId, playerName: sanitizedName });
    
    // Notify host and all players in room
    io.to(roomId).emit('room:player-list', {
      players: Array.from(room.gameState.players.values()),
    });
  });

  // Host starts the game
  socket.on('host:start-game', ({ roomId, startYear }: { roomId: string; startYear: number }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      socket.emit('host:start-game-error', { message: 'Too many requests. Please wait.' });
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('host:start-game-error', { message: 'Invalid room ID format' });
      return;
    }
    
    // Validate year
    if (!validateYear(startYear)) {
      socket.emit('host:start-game-error', { message: 'Invalid year. Must be between 1900 and 2100' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('host:start-game-error', { message: 'Room not found' });
      return;
    }

    // Validate host authorization
    if (!validateAndUpdateHost(room, socket.id)) {
      socket.emit('host:start-game-error', { message: 'Not authorized to start game' });
      return;
    }

    // Don't allow starting if game is already started
    if (room.gameState.state !== 'lobby') {
      socket.emit('host:start-game-error', { message: 'Game already started' });
      return;
    }

    room.gameState.state = 'playing';
    room.gameState.startYear = startYear;
    room.gameState.timeline = [startYear];
    room.gameState.currentRound = 1;
    updateRoomActivity(roomId);

    io.to(roomId).emit('game:started', {
      startYear,
      round: room.gameState.currentRound,
    });
  });

  // Player submits a guess
  socket.on('player:submit-guess', ({ roomId, year }: { roomId: string; year: number }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('error', { message: 'Invalid room ID format' });
      return;
    }
    
    // Validate year
    if (!validateYear(year)) {
      socket.emit('error', { message: 'Invalid year. Must be between 1900 and 2100' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room) return;

    const player = room.gameState.players.get(socket.id);
    if (!player || !player.isActive) return;

    if (room.gameState.state !== 'playing') return;

    room.gameState.guesses.set(socket.id, year);
    player.currentGuess = year;
    updateRoomActivity(roomId);

    // Notify host of new guess
    io.to(room.gameState.hostId).emit('host:guess-received', {
      playerId: socket.id,
      playerName: player.name,
      year,
    });

    // Notify player
    socket.emit('player:guess-submitted', { year });
  });

  // Host submits correct answer
  socket.on('host:submit-answer', ({ roomId, correctYear }: { roomId: string; correctYear: number }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('error', { message: 'Invalid room ID format' });
      return;
    }
    
    // Validate year
    if (!validateYear(correctYear)) {
      socket.emit('error', { message: 'Invalid year. Must be between 1900 and 2100' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room || !validateAndUpdateHost(room, socket.id)) {
      return;
    }

    room.gameState.correctYear = correctYear;
    room.gameState.state = 'round-results';
    updateRoomActivity(roomId);

    // Evaluate guesses
    const { eliminated, active } = evaluateGuesses(room.gameState);

    // Insert correct year into timeline
    room.gameState.timeline = insertYearIntoTimeline(correctYear, room.gameState.timeline);

    // Check if game should end
    const gameEnded = checkGameEnd(room.gameState);

    // Prepare guess results with correct/incorrect status
    const guessResults = Array.from(room.gameState.players.entries()).map(([playerId, player]) => {
      const guess = room.gameState.guesses.get(playerId);
      const isCorrect = !eliminated.includes(playerId) && player.isActive;
      return {
        playerId,
        playerName: player.name,
        guess,
        isCorrect,
      };
    });

    // Send results to all players
    io.to(roomId).emit('game:round-results', {
      correctYear,
      timeline: room.gameState.timeline,
      eliminated: eliminated.map(id => room.gameState.players.get(id)?.name).filter(Boolean),
      active: active.map(id => room.gameState.players.get(id)?.name).filter(Boolean),
      gameEnded,
      winner: room.gameState.winner ? room.gameState.players.get(room.gameState.winner)?.name : undefined,
      guessResults, // Include guess results for host display
    });

    // Send individual results to players
    room.gameState.players.forEach((player, playerId) => {
      const guess = room.gameState.guesses.get(playerId);
      const isEliminated = eliminated.includes(playerId);
      
      io.to(playerId).emit('player:round-result', {
        guess,
        correctYear,
        isEliminated,
        isWinner: playerId === room.gameState.winner,
      });
    });

    // Clear guesses for next round
    room.gameState.guesses.clear();
    room.gameState.correctYear = undefined;
  });

  // Host starts next round
  socket.on('host:next-round', ({ roomId }: { roomId: string }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('error', { message: 'Invalid room ID format' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room || !validateAndUpdateHost(room, socket.id)) {
      return;
    }

    if (room.gameState.state === 'finished') {
      return;
    }

    room.gameState.state = 'playing';
    room.gameState.currentRound += 1;
    updateRoomActivity(roomId);

    io.to(roomId).emit('game:next-round', {
      round: room.gameState.currentRound,
      timeline: room.gameState.timeline,
    });
  });

  // Host resets game
  socket.on('host:reset-game', ({ roomId, keepPlayers }: { roomId: string; keepPlayers?: boolean }) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }
    
    // Validate room ID
    if (!validateRoomId(roomId)) {
      socket.emit('error', { message: 'Invalid room ID format' });
      return;
    }
    
    const room = getRoom(roomId);
    if (!room || !validateAndUpdateHost(room, socket.id)) {
      return;
    }

    room.gameState.state = 'lobby';
    room.gameState.timeline = [];
    room.gameState.currentRound = 0;
    room.gameState.startYear = undefined;
    room.gameState.correctYear = undefined;
    room.gameState.guesses.clear();
    room.gameState.winner = undefined;

    if (keepPlayers) {
      // Reset all players to active but keep them
      room.gameState.players.forEach(player => {
        player.isActive = true;
        player.currentGuess = undefined;
      });
    } else {
      // Remove all players
      room.gameState.players.clear();
    }

    updateRoomActivity(roomId);

    io.to(roomId).emit('game:reset', {
      players: Array.from(room.gameState.players.values()),
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and remove player from room
    for (const [roomId, socketSet] of Array.from(io.sockets.adapter.rooms.entries())) {
      if (socketSet.has(socket.id)) {
        const room = getRoom(roomId);
        if (room) {
          // Update room count if this was a host
          if (room.gameState.hostId === socket.id) {
            const count = socketRoomCount.get(socket.id) || 0;
            socketRoomCount.set(socket.id, Math.max(0, count - 1));
          }
          
          removePlayerFromRoom(roomId, socket.id);
          
          io.to(roomId).emit('room:player-list', {
            players: Array.from(room.gameState.players.values()),
          });
        }
        break;
      }
    }
    
    // Clean up room count
    socketRoomCount.delete(socket.id);
  });
});

// Export httpServer, io, app, and PORT for use in combined server
export { httpServer, io, app, PORT };

// Function to start the server (for use in combined server)
export function startSocketServer(port?: number) {
  const serverPort = port || PORT;
  httpServer.listen(serverPort, () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   🎮 Socket.IO Server (Backend)      ║');
    console.log(`║   Port: ${serverPort}                      ║`);
    console.log('║   Status: ✅ Kører                  ║');
    console.log('╚═══════════════════════════════════════╝\n');
  });
  return httpServer;
}

// Only start server if this file is run directly (not imported)
// Check for both CommonJS and ES module patterns
if (typeof require !== 'undefined' && require.main === module) {
  startSocketServer();
}

