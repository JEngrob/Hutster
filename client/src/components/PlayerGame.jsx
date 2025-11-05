import { useState, useEffect } from 'react'
import { getSocket } from '../services/socket'
import './PlayerGame.css'

function PlayerGame({ gamePin, playerName, onExit }) {
  const [socket] = useState(() => getSocket())
  const [gameState, setGameState] = useState('waiting') // waiting, question, answered, results, finished
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    // Join game as player
    socket.emit('player:join', { gamePin, playerName })

    socket.on('player:joined', () => {
      console.log('Player joined successfully')
      setGameState('waiting')
    })

    socket.on('game:started', (questionData) => {
      setGameState('question')
      setCurrentQuestion(questionData)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setTimeLeft(questionData.timeLimit)
    })

    socket.on('question:new', (questionData) => {
      setGameState('question')
      setCurrentQuestion(questionData)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setTimeLeft(questionData.timeLimit)
    })

    socket.on('answer:result', (result) => {
      setAnswerResult(result)
      setGameState('answered')
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
      onExit()
    })

    return () => {
      socket.off('player:joined')
      socket.off('game:started')
      socket.off('question:new')
      socket.off('answer:result')
      socket.off('leaderboard:update')
      socket.off('game:ended')
      socket.off('error')
    }
  }, [socket, gamePin, playerName, onExit])

  // Timer countdown
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'question' && timeLeft === 0 && selectedAnswer === null) {
      // Time's up - auto submit no answer
      setGameState('answered')
    }
  }, [gameState, timeLeft, selectedAnswer])

  const submitAnswer = (answerIndex) => {
    if (selectedAnswer !== null || gameState !== 'question') return

    setSelectedAnswer(answerIndex)
    const timeSpent = currentQuestion.timeLimit - timeLeft

    socket.emit('player:answer', {
      gamePin,
      questionIndex: currentQuestion.questionIndex,
      answerIndex,
      timeSpent
    })
  }

  const getPlayerRank = () => {
    const rank = leaderboard.findIndex(p => p.name === playerName)
    return rank !== -1 ? rank + 1 : '-'
  }

  const getPlayerScore = () => {
    const player = leaderboard.find(p => p.name === playerName)
    return player ? player.score : 0
  }

  return (
    <div className="player-game">
      <div className="player-container">
        <div className="player-header">
          <div className="player-name">👤 {playerName}</div>
          {leaderboard.length > 0 && (
            <div className="player-stats">
              <span>#{getPlayerRank()}</span>
              <span>{getPlayerScore()} point</span>
            </div>
          )}
        </div>

        {gameState === 'waiting' && (
          <div className="waiting-screen">
            <h2>Venter på at spillet starter...</h2>
            <p className="pin-display">PIN: {gamePin}</p>
            <div className="loader"></div>
          </div>
        )}

        {gameState === 'question' && currentQuestion && (
          <div className="question-screen">
            <div className="timer-bar">
              <div
                className="timer-fill"
                style={{
                  width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`,
                  backgroundColor: timeLeft <= 5 ? '#e74c3c' : '#3498db'
                }}
              ></div>
            </div>

            <div className="question-header">
              <span>Spørgsmål {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}</span>
              <span className="time-display">{timeLeft}s</span>
            </div>

            <h2 className="question-text">{currentQuestion.question}</h2>

            <div className="answers-grid">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-btn ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => submitAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="answer-letter">{['A', 'B', 'C', 'D'][index]}</span>
                  <span className="answer-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'answered' && answerResult && (
          <div className={`result-screen ${answerResult.correct ? 'correct' : 'incorrect'}`}>
            <div className="result-icon">
              {answerResult.correct ? '✓' : '✗'}
            </div>
            <h2>{answerResult.correct ? 'Korrekt!' : 'Forkert'}</h2>
            {answerResult.correct && (
              <p className="points-earned">+{answerResult.points} point</p>
            )}
            <p className="waiting-message">Venter på næste spørgsmål...</p>
          </div>
        )}

        {gameState === 'answered' && !answerResult && (
          <div className="result-screen timeout">
            <div className="result-icon">⏱</div>
            <h2>Tiden løb ud!</h2>
            <p className="waiting-message">Venter på næste spørgsmål...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="finished-screen">
            <h2>🏆 Spillet er slut!</h2>
            <div className="player-final-stats">
              <div className="stat-card">
                <div className="stat-label">Din placering</div>
                <div className="stat-value">#{getPlayerRank()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Dine point</div>
                <div className="stat-value">{getPlayerScore()}</div>
              </div>
            </div>

            <div className="final-leaderboard">
              <h3>Leaderboard</h3>
              {leaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`leaderboard-row ${player.name === playerName ? 'highlight' : ''}`}
                >
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.name}</span>
                  <span className="score">{player.score}</span>
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

export default PlayerGame
