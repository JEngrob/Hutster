import './Home.css'

function Home({ onStartHost, onStartPlayer }) {
  return (
    <div className="home">
      <div className="home-container">
        <h1 className="title">🎮 Hutster Quiz</h1>
        <p className="subtitle">Live quiz med venner</p>

        <div className="button-group">
          <button className="btn btn-primary btn-large" onClick={onStartHost}>
            Host Quiz
          </button>
          <button className="btn btn-secondary btn-large" onClick={onStartPlayer}>
            Deltag i Quiz
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
