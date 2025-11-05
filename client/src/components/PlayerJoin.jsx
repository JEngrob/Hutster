import { useState } from 'react'
import './PlayerJoin.css'

const API_URL = 'http://localhost:3000'

function PlayerJoin({ onJoined, onBack }) {
  const [gamePin, setGamePin] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)

  const joinGame = async () => {
    if (!gamePin.trim() || !playerName.trim()) {
      alert('Indtast både PIN og navn')
      return
    }

    setLoading(true)

    try {
      // Check if game exists
      const response = await fetch(`${API_URL}/api/game/${gamePin}`)
      const data = await response.json()

      if (data.exists) {
        onJoined(gamePin, playerName)
      } else {
        alert('Spillet blev ikke fundet. Tjek PIN-koden.')
      }
    } catch (error) {
      alert('Fejl ved tilslutning: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      joinGame()
    }
  }

  return (
    <div className="player-join">
      <div className="join-container">
        <button className="btn-back" onClick={onBack}>← Tilbage</button>

        <h1>Deltag i Quiz</h1>

        <div className="form-group">
          <label>Spil PIN</label>
          <input
            type="text"
            className="input pin-input"
            value={gamePin}
            onChange={(e) => setGamePin(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="123456"
            maxLength={6}
          />
        </div>

        <div className="form-group">
          <label>Dit navn</label>
          <input
            type="text"
            className="input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="F.eks. Anna"
            maxLength={20}
          />
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={joinGame}
          disabled={loading}
        >
          {loading ? 'Tilslutter...' : 'Deltag'}
        </button>
      </div>
    </div>
  )
}

export default PlayerJoin
