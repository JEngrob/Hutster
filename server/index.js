import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './gameManager.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const gameManager = new GameManager();

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/quiz/create', (req, res) => {
  const { quiz } = req.body;
  const gamePin = gameManager.createGame(quiz);
  res.json({ gamePin });
});

app.get('/api/game/:pin', (req, res) => {
  const game = gameManager.getGame(req.params.pin);
  if (game) {
    res.json({ exists: true });
  } else {
    res.status(404).json({ exists: false, error: 'Game not found' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Host joins game
  socket.on('host:join', (gamePin) => {
    const game = gameManager.getGame(gamePin);
    if (game) {
      socket.join(`game-${gamePin}`);
      game.hostSocketId = socket.id;
      socket.emit('host:joined', {
        gamePin,
        playerCount: game.players.length
      });
    } else {
      socket.emit('error', { message: 'Game not found' });
    }
  });

  // Player joins game
  socket.on('player:join', ({ gamePin, playerName }) => {
    const game = gameManager.getGame(gamePin);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game has already started' });
      return;
    }

    const player = gameManager.addPlayer(gamePin, socket.id, playerName);
    socket.join(`game-${gamePin}`);

    socket.emit('player:joined', {
      playerId: player.id,
      playerName: player.name
    });

    // Notify host of new player
    io.to(`game-${gamePin}`).emit('player:list', {
      players: game.players.map(p => ({ id: p.id, name: p.name }))
    });
  });

  // Host starts game
  socket.on('host:start', (gamePin) => {
    const game = gameManager.getGame(gamePin);
    if (game && game.hostSocketId === socket.id) {
      game.status = 'playing';
      game.currentQuestion = 0;

      const questionData = gameManager.getCurrentQuestion(gamePin);
      io.to(`game-${gamePin}`).emit('game:started', questionData);
    }
  });

  // Host shows next question
  socket.on('host:next-question', (gamePin) => {
    const game = gameManager.getGame(gamePin);
    if (game && game.hostSocketId === socket.id) {
      const questionData = gameManager.nextQuestion(gamePin);

      if (questionData) {
        io.to(`game-${gamePin}`).emit('question:new', questionData);
      } else {
        // Game over - send final results
        const results = gameManager.getLeaderboard(gamePin);
        game.status = 'finished';
        io.to(`game-${gamePin}`).emit('game:ended', { leaderboard: results });
      }
    }
  });

  // Player submits answer
  socket.on('player:answer', ({ gamePin, questionIndex, answerIndex, timeSpent }) => {
    const result = gameManager.submitAnswer(
      gamePin,
      socket.id,
      questionIndex,
      answerIndex,
      timeSpent
    );

    if (result) {
      socket.emit('answer:result', {
        correct: result.correct,
        points: result.points
      });

      // Send updated leaderboard to all
      const leaderboard = gameManager.getLeaderboard(gamePin);
      io.to(`game-${gamePin}`).emit('leaderboard:update', { leaderboard });

      // Notify host of answer submission
      const game = gameManager.getGame(gamePin);
      if (game.hostSocketId) {
        io.to(game.hostSocketId).emit('player:answered', {
          playerId: socket.id,
          totalAnswers: game.players.filter(p =>
            p.answers[questionIndex] !== undefined
          ).length,
          totalPlayers: game.players.length
        });
      }
    }
  });

  // Player disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameManager.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
