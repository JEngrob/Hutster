import { useState } from 'react'
import './HostSetup.css'

const API_URL = 'http://localhost:3000'

function HostSetup({ onQuizCreated, onBack }) {
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState([{
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 20
  }])
  const [loading, setLoading] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 20
    }])
  }

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions]
    newQuestions[index][field] = value
    setQuestions(newQuestions)
  }

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options[oIndex] = value
    setQuestions(newQuestions)
  }

  const createQuiz = async () => {
    // Validate
    if (!quizTitle.trim()) {
      alert('Indtast en titel til quizzen')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        alert(`Spørgsmål ${i + 1}: Indtast et spørgsmål`)
        return
      }
      if (q.options.some(o => !o.trim())) {
        alert(`Spørgsmål ${i + 1}: Alle svarmuligheder skal udfyldes`)
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/quiz/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz: {
            title: quizTitle,
            questions
          }
        })
      })

      const data = await response.json()
      onQuizCreated(data.gamePin, { title: quizTitle, questions })
    } catch (error) {
      alert('Fejl ved oprettelse af quiz: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="host-setup">
      <div className="setup-container">
        <button className="btn-back" onClick={onBack}>← Tilbage</button>

        <h1>Opret Quiz</h1>

        <div className="form-group">
          <label>Quiz Titel</label>
          <input
            type="text"
            className="input"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="F.eks. Almen viden quiz"
          />
        </div>

        <div className="questions-list">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h3>Spørgsmål {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    className="btn-remove"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Fjern
                  </button>
                )}
              </div>

              <input
                type="text"
                className="input"
                value={q.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                placeholder="Skriv dit spørgsmål her..."
              />

              <div className="options-grid">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-row">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                    />
                    <input
                      type="text"
                      className="input"
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Svarmulighed ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Tidsbegrænsning (sekunder)</label>
                <input
                  type="number"
                  className="input"
                  value={q.timeLimit}
                  onChange={(e) => updateQuestion(qIndex, 'timeLimit', parseInt(e.target.value) || 20)}
                  min="5"
                  max="120"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={addQuestion}>
            + Tilføj Spørgsmål
          </button>
          <button
            className="btn btn-primary"
            onClick={createQuiz}
            disabled={loading}
          >
            {loading ? 'Opretter...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HostSetup
