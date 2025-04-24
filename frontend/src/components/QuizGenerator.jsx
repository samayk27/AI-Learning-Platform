import React, { useState } from "react";
import axios from "../api/api";

export default function QuizGenerator() {
  const [text, setText] = useState("");
  const [studentClass, setStudentClass] = useState("10");
  const [board, setBoard] = useState("CBSE");
  const [quizText, setQuizText] = useState("");
  const [parsedQuiz, setParsedQuiz] = useState([]);

  const pastScores = [
    { topic: "Electricity", correct: false },
    { topic: "Electricity", correct: true },
    { topic: "Magnetism", correct: false }
  ];

  const parseQuizText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const questions = [];
    let current = null;

    lines.forEach(line => {
      if (line.match(/^\*\*\d+\./)) {
        if (current) questions.push(current);
        current = {
          question: line.replace(/\*\*/g, "").replace(/^\d+\.\s*/, ""),
          options: [],
          answer: "",
          explanation: "",
          selected: "",
        };
      } else if (line.startsWith("(a)") || line.startsWith("(b)") || line.startsWith("(c)") || line.startsWith("(d)")) {
        current?.options.push(line);
      } else if (line.startsWith("**Answer:")) {
        current.answer = line.replace(/\*\*/g, "").replace("Answer:", "").trim();
      } else if (line.startsWith("**Explanation:")) {
        current.explanation = line.replace(/\*\*/g, "").replace("Explanation:", "").trim();
      } else if (current && current.explanation !== "") {
        current.explanation += " " + line;
      }
    });

    if (current) questions.push(current);
    return questions;
  };

  const handleGenerate = async () => {
    try {
      const res = await axios.post("/quiz/", {
        chapter_text: text,
        past_scores: pastScores,
        user_class: studentClass,
        board: board,
      });

      console.log("Quiz Response:", res.data);
      if (typeof res.data === "object" && res.data.quiz) {
        setQuizText(res.data.quiz);
        const parsed = parseQuizText(res.data.quiz);
        setParsedQuiz(parsed);
      } else {
        setQuizText("No quiz generated. Please check input.");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuizText("Error generating quiz.");
    }
  };

  const handleOptionSelect = (index, option) => {
    const updatedQuiz = [...parsedQuiz];
    updatedQuiz[index].selected = option;
    setParsedQuiz(updatedQuiz);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>🧠 AI-Generated Quiz</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Class:</label>
        <select value={studentClass} onChange={e => setStudentClass(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>

        <label style={{ marginLeft: "20px" }}>Board:</label>
        <select value={board} onChange={e => setBoard(e.target.value)}>
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="State">State</option>
          <option value="IB">IB</option>
        </select>
      </div>

      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter chapter content here..."
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <button onClick={handleGenerate} style={{ marginTop: "10px", padding: "10px 20px" }}>
        Generate Quiz
      </button>

      {parsedQuiz.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>📋 Quiz</h3>
          {parsedQuiz.map((q, idx) => (
            <div key={idx} style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ddd" }}>
              <strong>{idx + 1}. {q.question}</strong>
              <div style={{ marginTop: "10px" }}>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx}>
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={q.selected === opt}
                      onChange={() => handleOptionSelect(idx, opt)}
                    />
                    <label style={{ marginLeft: "8px" }}>{opt}</label>
                  </div>
                ))}
              </div>

              {q.selected && (
                <div style={{ marginTop: "10px" }}>
                  {q.selected.includes(q.answer) ? (
                    <p style={{ color: "green" }}>✅ Correct!</p>
                  ) : (
                    <p style={{ color: "red" }}>
                      ❌ Incorrect. Correct answer is: <strong>{q.answer}</strong>
                    </p>
                  )}
                  <p><em>Explanation: {q.explanation}</em></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
