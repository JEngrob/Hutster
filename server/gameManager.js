export class GameManager {
  constructor() {
    this.games = new Map();
  }

  // Generate random 6-digit game PIN
  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create new game
  createGame(quiz) {
    let pin = this.generatePin();
    // Ensure unique PIN
    while (this.games.has(pin)) {
      pin = this.generatePin();
    }

    const game = {
      pin,
      quiz,
      players: [],
      status: 'waiting', // waiting, playing, finished
      currentQuestion: -1,
      hostSocketId: null,
      createdAt: Date.now()
    };

    this.games.set(pin, game);

    // Auto-cleanup after 24 hours
    setTimeout(() => {
      this.games.delete(pin);
    }, 24 * 60 * 60 * 1000);

    return pin;
  }

  // Get game by PIN
  getGame(pin) {
    return this.games.get(pin);
  }

  // Add player to game
  addPlayer(pin, socketId, name) {
    const game = this.games.get(pin);
    if (!game) return null;

    const player = {
      id: socketId,
      name,
      score: 0,
      answers: {}
    };

    game.players.push(player);
    return player;
  }

  // Remove player
  removePlayer(socketId) {
    for (const [pin, game] of this.games.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socketId);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        return true;
      }
    }
    return false;
  }

  // Get current question
  getCurrentQuestion(pin) {
    const game = this.games.get(pin);
    if (!game || game.currentQuestion < 0) return null;

    const question = game.quiz.questions[game.currentQuestion];
    return {
      questionIndex: game.currentQuestion,
      questionNumber: game.currentQuestion + 1,
      totalQuestions: game.quiz.questions.length,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit || 20
    };
  }

  // Move to next question
  nextQuestion(pin) {
    const game = this.games.get(pin);
    if (!game) return null;

    game.currentQuestion++;

    if (game.currentQuestion >= game.quiz.questions.length) {
      return null; // No more questions
    }

    return this.getCurrentQuestion(pin);
  }

  // Submit answer
  submitAnswer(pin, playerId, questionIndex, answerIndex, timeSpent) {
    const game = this.games.get(pin);
    if (!game) return null;

    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    // Check if already answered
    if (player.answers[questionIndex] !== undefined) {
      return null;
    }

    const question = game.quiz.questions[questionIndex];
    const correct = answerIndex === question.correctAnswer;

    // Calculate points: base points + time bonus
    let points = 0;
    if (correct) {
      const basePoints = 1000;
      const timeLimit = question.timeLimit || 20;
      const timeBonus = Math.max(0, Math.floor((timeLimit - timeSpent) / timeLimit * 500));
      points = basePoints + timeBonus;
    }

    player.answers[questionIndex] = {
      answer: answerIndex,
      correct,
      points,
      timeSpent
    };

    player.score += points;

    return { correct, points };
  }

  // Get leaderboard
  getLeaderboard(pin) {
    const game = this.games.get(pin);
    if (!game) return [];

    return game.players
      .map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      }))
      .sort((a, b) => b.score - a.score);
  }
}
