import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "../api/api";
import QuizRenderer from "./QuizRenderer";

export default function QuizGenerator() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [text, setText] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [studentClass, setStudentClass] = useState(() => {
    return localStorage.getItem("quizPreferences_class") || "10";
  });
  const [board, setBoard] = useState(() => {
    return localStorage.getItem("quizPreferences_board") || "CBSE";
  });
  const [quizText, setQuizText] = useState("");
  const [parsedQuiz, setParsedQuiz] = useState(() => {
    const saved = localStorage.getItem("currentQuiz");
    return saved ? JSON.parse(saved) : [];
  });
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem("currentScore");
    return saved ? JSON.parse(saved) : null;
  });
  const [difficultyPreference, setDifficultyPreference] = useState(() => {
    return parseFloat(localStorage.getItem("quizPreferences_difficulty")) || 0.5;
  });
  const [difficultyIncreased, setDifficultyIncreased] = useState(false);
  const [recommendations, setRecommendations] = useState(() => {
    const saved = localStorage.getItem("currentRecommendations");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem(`userStats_${user?.id}`);
    return saved ? JSON.parse(saved) : {
      proficiency_level: 0.5,
      completed_quizzes: 0,
      total_correct: 0,
      total_questions: 0
    };
  });
  
  const [chapterStats, setChapterStats] = useState(() => {
    const saved = localStorage.getItem(`chapterStats_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [pastScores, setPastScores] = useState(() => {
    const saved = localStorage.getItem(`pastScores_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("quizPreferences_class", studentClass);
  }, [studentClass]);

  useEffect(() => {
    localStorage.setItem("quizPreferences_board", board);
  }, [board]);

  useEffect(() => {
    localStorage.setItem("quizPreferences_difficulty", difficultyPreference.toString());
  }, [difficultyPreference]);

  useEffect(() => {
    if (parsedQuiz.length > 0) {
      localStorage.setItem("currentQuiz", JSON.stringify(parsedQuiz));
    }
  }, [parsedQuiz]);

  useEffect(() => {
    if (score !== null) {
      localStorage.setItem("currentScore", JSON.stringify(score));
    }
  }, [score]);

  useEffect(() => {
    if (recommendations.length > 0) {
      localStorage.setItem("currentRecommendations", JSON.stringify(recommendations));
    }
  }, [recommendations]);

  // Save user-specific data whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`userStats_${user.id}`, JSON.stringify(userStats));
    }
  }, [userStats, user?.id]);
  
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`chapterStats_${user.id}`, JSON.stringify(chapterStats));
    }
  }, [chapterStats, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`pastScores_${user.id}`, JSON.stringify(pastScores));
    }
  }, [pastScores, user?.id]);

  // Load user's past scores when component mounts or user changes
  useEffect(() => {
    const loadUserScores = async () => {
      if (!isSignedIn) return;
      
      try {
        const response = await axios.get(`/scores/${user.id}`);
        const serverScores = response.data.scores || [];
        const serverStats = response.data.stats || userStats;
        const serverChapterStats = response.data.chapter_stats || {};
        
        // Merge server data with local data
        const mergedScores = [...new Set([...serverScores, ...pastScores])];
        setPastScores(mergedScores);
        
        // Update stats with server data
        setUserStats(prev => ({
          ...prev,
          ...serverStats
        }));
        
        // Update chapter stats with server data
        setChapterStats(prev => ({
          ...prev,
          ...serverChapterStats
        }));
      } catch (error) {
        console.error("Error loading user scores:", error);
        setError("Failed to load user scores");
      }
    };

    if (isLoaded && isSignedIn) {
      loadUserScores();
    }
  }, [isLoaded, isSignedIn, user]);

  // Clear quiz when generating new one
  const handleGenerate = async () => {
    if (!chapterName.trim()) {
      setError("Please enter a chapter name");
      return;
    }

    setLoading(true);
    setError(null);
    
    // Clear previous quiz state
    localStorage.removeItem("currentQuiz");
    localStorage.removeItem("currentScore");
    localStorage.removeItem("currentRecommendations");
    localStorage.setItem("currentChapter", chapterName.trim());
    
    try {
      setScore(null);
      const res = await axios.post("/quiz/", {
        chapter_name: chapterName.trim(),
        chapter_text: text.trim() || null,
        past_scores: pastScores,
        user_class: studentClass,
        board: board,
        user_id: isSignedIn ? user.id : 'guest',
        difficulty_preference: difficultyPreference
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      if (typeof res.data === "object" && res.data.quiz) {
        setQuizText(res.data.quiz);
        const parsed = parseQuizText(res.data.quiz);
        setParsedQuiz(parsed);
        setRecommendations(res.data.recommended_topics || []);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setError(error.message || "Error generating quiz. Please try again.");
      setQuizText("");
      setParsedQuiz([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleOptionSelect = (index, option) => {
    const updatedQuiz = [...parsedQuiz];
    updatedQuiz[index].selected = option;
    setParsedQuiz(updatedQuiz);
  };

  const handleSubmit = async () => {
    if (!isSignedIn) {
      setError("Please sign in to save your results");
      return;
    }

    try {
      // Validate that all questions have been answered
      const unansweredQuestions = parsedQuiz.filter(q => !q.selected);
      if (unansweredQuestions.length > 0) {
        setError(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
        return;
      }

      const results = parsedQuiz.map((q, index) => {
        const isCorrect = q.selected.includes(q.answer);
        return {
          chapter: chapterName.trim(),
          topic: q.question.substring(0, 50) + "...", // Use truncated question as topic
          correct: isCorrect,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          difficulty: difficultyPreference
        };
      });

      const response = await axios.post(`/scores/${user.id}`, { scores: results });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const finalScore = results.reduce((score, q) => q.correct ? score + 1 : score, 0);
      setScore(finalScore);
      
      setPastScores([...pastScores, ...results]);
      
      // Update user stats with the response from the server
      if (response.data.stats) {
        setUserStats(prev => ({
          ...prev,
          ...response.data.stats,
          completed_quizzes: prev.completed_quizzes + 1
        }));
      }
      
      // Update chapter stats with the response from the server
      if (response.data.chapter_stats) {
        setChapterStats(prev => ({
          ...prev,
          ...response.data.chapter_stats
        }));
      }
      
      // Auto-increase difficulty if score exceeds threshold (75%)
      const scorePercentage = (finalScore / parsedQuiz.length) * 100;
      if (scorePercentage >= 75 && difficultyPreference < 0.9) {
        const newDifficulty = Math.min(difficultyPreference + 0.1, 0.9);
        setDifficultyPreference(newDifficulty);
        setDifficultyIncreased(true);
      } else {
        setDifficultyIncreased(false);
      }
    } catch (error) {
      console.error("Error saving quiz results:", error);
      setError("Failed to save quiz results: " + (error.response?.data?.detail || error.message));
    }
  };

  // Add a cleanup function when leaving the quiz
  useEffect(() => {
    return () => {
      // Don't clear user-specific data or preferences
      // Only clear current quiz state if needed
      if (!parsedQuiz.length) {
        localStorage.removeItem("currentQuiz");
        localStorage.removeItem("currentScore");
        localStorage.removeItem("currentRecommendations");
      }
    };
  }, [parsedQuiz.length]);

  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>🧠 AI-Generated Quiz</h2>

      {error && (
        <div style={{ 
          padding: "10px", 
          color: "#c62828", 
          borderRadius: "4px",
          marginBottom: "20px" 
        }}>
          {error}
        </div>
      )}
      
      {difficultyIncreased && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e8f5e9", 
          color: "#2e7d32", 
          borderRadius: "4px",
          marginBottom: "20px" 
        }}>
          Great job! Your difficulty level has been automatically increased to {Math.round(difficultyPreference * 100)}% based on your performance.
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
          <div>
            <label>Class: </label>
            <select value={studentClass} onChange={e => setStudentClass(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Board: </label>
            <select value={board} onChange={e => setBoard(e.target.value)}>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State">State</option>
              <option value="IB">IB</option>
            </select>
          </div>

          <div>
            <label>Difficulty: </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={difficultyPreference}
              onChange={e => setDifficultyPreference(parseFloat(e.target.value))}
            />
            <span>{Math.round(difficultyPreference * 100)}%</span>
          </div>
        </div>

        {isSignedIn && (
          <div style={{
            padding: "10px", 
            borderRadius: "5px",
            marginBottom: "10px",
          }}>
            <h4>Your Stats</h4>
            <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
              <div>Quizzes Completed: {userStats.completed_quizzes}</div>
              <div>Average Score: {userStats.total_questions ? 
                Math.round((userStats.total_correct / userStats.total_questions) * 100) : 0}%</div>
              <div>Proficiency Level: {Math.round(userStats.proficiency_level * 100)}%</div>
            </div>
            
            {chapterName && chapterStats[chapterName] && (
              <div style={{ marginTop: "10px", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "5px" }}>
                <h5 style={{ margin: "0 0 8px 0" }}>Chapter: {chapterName}</h5>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div>Questions: {chapterStats[chapterName].total_questions}</div>
                  <div>Correct: {chapterStats[chapterName].total_correct}</div>
                  <div>Proficiency: {Math.round(chapterStats[chapterName].proficiency * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        type="text"
        value={chapterName}
        onChange={e => setChapterName(e.target.value)}
        placeholder="Enter chapter name..."
        style={{ 
          width: "100%", 
          padding: "10px", 
          fontSize: "16px",
          marginBottom: "10px"
        }}
      />
      
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter chapter content here (optional)..."
        style={{ 
          width: "100%", 
          padding: "10px", 
          fontSize: "16px",
          minHeight: "200px",
          marginBottom: "20px"
        }}
      />

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        style={{ 
          marginTop: "10px", 
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {recommendations.length > 0 && (
        <div style={{ 
          marginTop: "20px",
          padding: "15px",
          borderRadius: "5px" 
        }}>
          <h3>Recommended Focus Areas</h3>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>
                {rec.topic} - Proficiency: {Math.round(rec.proficiency * 100)}% 
                ({rec.priority} priority)
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsedQuiz.length > 0 && (
        <QuizRenderer
          questions={parsedQuiz}
          onOptionSelect={handleOptionSelect}
          onSubmit={handleSubmit}
          score={score}
          recommendations={recommendations}
        />
      )}
    </div>
  );
}
