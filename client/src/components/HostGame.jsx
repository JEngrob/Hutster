import { useState, useEffect } from 'react'
import { getSocket } from '../services/socket'
import './HostGame.css'

function HostGame({ gamePin, quiz, onExit }) {
  const [socket] = useState(() => getSocket())
  const [gameState, setGameState] = useState('waiting') // waiting, playing, finished
  const [players, setPlayers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    // Join as host
    socket.emit('host:join', gamePin)

    socket.on('host:joined', () => {
      console.log('Host joined game')
    })

    socket.on('player:list', (data) => {
      setPlayers(data.players)
    })

    socket.on('game:started', (questionData) => {
      setGameState('playing')
      setCurrentQuestion(questionData)
      setAnsweredCount(0)
    })

    socket.on('question:new', (questionData) => {
      setCurrentQuestion(questionData)
      setAnsweredCount(0)
    })

    socket.on('player:answered', (data) => {
      setAnsweredCount(data.totalAnswers)
    })

    socket.on('leaderboard:update', (data) => {
      setLeaderboard(data.leaderboard)
    })

    socket.on('game:ended', (data) => {
      setGameState('finished')
      setLeaderboard(data.leaderboard)
    })

    socket.on('error', (data) => {
      alert('Fejl: ' + data.message)
    })

    return () => {
      socket.off('host:joined')
      socket.off('player:list')
      socket.off('game:started')
      socket.off('question:new')
      socket.off('player:answered')
      socket.off('leaderboard:update')
      socket.off('game:ended')
      socket.off('error')
    }
  }, [socket, gamePin])

  const startGame = () => {
    socket.emit('host:start', gamePin)
  }

  const nextQuestion = () => {
    socket.emit('host:next-question', gamePin)
  }

  const getCorrectAnswerLetter = () => {
    if (!currentQuestion) return ''
    const letters = ['A', 'B', 'C', 'D']
    const questionData = quiz.questions[currentQuestion.questionIndex]
    return letters[questionData.correctAnswer]
  }

  return (
    <div className="host-game">
      <div className="host-container">
        <div className="host-header">
          <h1>🎮 {quiz.title}</h1>
          <div className="game-pin">
            <span>PIN:</span>
            <strong>{gamePin}</strong>
          </div>
        </div>

        {gameState === 'waiting' && (
          <div className="waiting-area">
            <h2>Ventende spillere ({players.length})</h2>
            <div className="players-grid">
              {players.map(player => (
                <div key={player.id} className="player-badge">
                  {player.name}
                </div>
              ))}
              {players.length === 0 && (
                <p className="empty-message">Ingen spillere endnu...</p>
              )}
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={startGame}
              disabled={players.length === 0}
            >
              Start Spil
            </button>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="playing-area">
            <div className="question-info">
              <span>Spørgsmål {currentQuestion.questionNumber} / {currentQuestion.totalQuestions}</span>
              <span>Besvarede: {answeredCount} / {players.length}</span>
            </div>

            <div className="question-display">
              <h2>{currentQuestion.question}</h2>
              <div className="options-display">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className={`option-display ${
                    quiz.questions[currentQuestion.questionIndex].correctAnswer === index ? 'correct' : ''
                  }`}>
                    <span className="option-letter">{['A', 'B', 'C', 'D'][index]}</span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
              <p className="correct-info">Korrekt svar: {getCorrectAnswerLetter()}</p>
            </div>

            {leaderboard.length > 0 && (
              <div className="mini-leaderboard">
                <h3>Top 5</h3>
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div key={player.id} className="leaderboard-row">
                    <span>#{index + 1}</span>
                    <span>{player.name}</span>
                    <span>{player.score}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-primary btn-large" onClick={nextQuestion}>
              Næste Spørgsmål
            </button>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="finished-area">
            <h2>🏆 Spillet er slut!</h2>
            <div className="final-leaderboard">
              {leaderboard.map((player, index) => (
                <div key={player.id} className={`leaderboard-card rank-${index + 1}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    <div className="player-score">{player.score} point</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={onExit}>
              Tilbage til Start
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HostGame
