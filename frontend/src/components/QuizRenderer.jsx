import React from 'react';

export default function QuizRenderer({ questions, onOptionSelect, onSubmit, score, recommendations }) {
  return (
    <div style={{ marginTop: "30px" }}>
      <h3>📋 Quiz</h3>
      {questions.map((q, idx) => (
        <div key={idx} style={{ 
          marginBottom: "20px", 
          padding: "20px", 
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}>
          <strong>{idx + 1}. {q.question}</strong>
          <div style={{ marginTop: "15px" }}>
            {q.options.map((opt, optIdx) => (
              <div key={optIdx} style={{ marginBottom: "8px" }}>
                <input
                  type="radio"
                  id={`q-${idx}-${optIdx}`}
                  name={`q-${idx}`}
                  checked={q.selected === opt}
                  onChange={() => onOptionSelect(idx, opt)}
                />
                <label 
                  htmlFor={`q-${idx}-${optIdx}`}
                  style={{ 
                    marginLeft: "8px",
                    cursor: "pointer"
                  }}
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>

          {q.selected && score !== null && (
            <div style={{ 
              marginTop: "15px",
              padding: "10px",
              borderRadius: "4px",
              backgroundColor: q.selected.includes(q.answer) ? "#e8f5e9" : "#ffebee"
            }}>
              {q.selected.includes(q.answer) ? (
                <p style={{ color: "#2e7d32", margin: "0 0 10px 0" }}>✅ Correct!</p>
              ) : (
                <p style={{ color: "#c62828", margin: "0 0 10px 0" }}>
                  ❌ Incorrect. Correct answer: <strong>{q.answer}</strong>
                </p>
              )}
              <p style={{ margin: "0", fontSize: "0.9em", color: "#666" }}>
                <strong>Explanation:</strong> {q.explanation}
              </p>
            </div>
          )}
          {q.selected && score === null && (
            <div style={{ 
              marginTop: "15px",
              padding: "10px",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              backgroundColor: "#f5f5f5"
            }}>
              <p style={{ margin: "0", color: "#0d47a1" }}>
                Answer selected. Submit the quiz to see if you're correct.
              </p>
            </div>
          )}
        </div>
      ))}
      
      <button 
        onClick={onSubmit} 
        style={{ 
          marginTop: "20px", 
          padding: "12px 24px", 
          backgroundColor: "#4CAF50", 
          color: "white", 
          border: "none", 
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background-color 0.3s"
        }}
        onMouseOver={e => e.target.style.backgroundColor = "#45a049"}
        onMouseOut={e => e.target.style.backgroundColor = "#4CAF50"}
      >
        Submit Quiz
      </button>

      {score !== null && (
        <div style={{ 
          marginTop: "30px",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Quiz Results</h3>
          <p style={{ fontSize: "24px", margin: "0 0 20px 0" }}>
            Score: {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          
          {Math.round((score / questions.length) * 100) >= 75 && (
            <div style={{ 
              padding: "10px", 
              backgroundColor: "#e8f5e9", 
              color: "#2e7d32", 
              borderRadius: "4px",
              marginBottom: "20px",
              textAlign: "left"
            }}>
              <p style={{ margin: "0" }}>
                <strong>🎉 Great achievement!</strong> You scored above 75% on this quiz.
                {Math.round((score / questions.length) * 100) === 100 && 
                  " Perfect score! You've mastered this content."}
              </p>
            </div>
          )}
          
          {recommendations && recommendations.length > 0 && (
            <div style={{ textAlign: "left" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>Recommended Topics for Review:</h4>
              <ul style={{ margin: "0", paddingLeft: "20px" }}>
                {recommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: "5px" }}>
                    {rec.topic} - Proficiency: {Math.round(rec.proficiency * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 