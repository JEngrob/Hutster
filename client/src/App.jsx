import { useState } from 'react'
import Home from './components/Home'
import HostSetup from './components/HostSetup'
import HostGame from './components/HostGame'
import PlayerJoin from './components/PlayerJoin'
import PlayerGame from './components/PlayerGame'
import './App.css'

function App() {
  const [view, setView] = useState('home') // home, host-setup, host-game, player-join, player-game
  const [gamePin, setGamePin] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [quiz, setQuiz] = useState(null)

  const startHost = () => {
    setView('host-setup')
  }

  const startPlayer = () => {
    setView('player-join')
  }

  const onQuizCreated = (pin, quizData) => {
    setGamePin(pin)
    setQuiz(quizData)
    setView('host-game')
  }

  const onPlayerJoined = (pin, name) => {
    setGamePin(pin)
    setPlayerName(name)
    setView('player-game')
  }

  const goHome = () => {
    setView('home')
    setGamePin(null)
    setPlayerName(null)
    setQuiz(null)
  }

  return (
    <div className="app">
      {view === 'home' && (
        <Home onStartHost={startHost} onStartPlayer={startPlayer} />
      )}
      {view === 'host-setup' && (
        <HostSetup onQuizCreated={onQuizCreated} onBack={goHome} />
      )}
      {view === 'host-game' && (
        <HostGame gamePin={gamePin} quiz={quiz} onExit={goHome} />
      )}
      {view === 'player-join' && (
        <PlayerJoin onJoined={onPlayerJoined} onBack={goHome} />
      )}
      {view === 'player-game' && (
        <PlayerGame gamePin={gamePin} playerName={playerName} onExit={goHome} />
      )}
    </div>
  )
}

export default App
