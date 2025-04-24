import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <h1>Welcome to AI Education Assistant</h1>
      <p>Empower your learning with AI-powered tools. Summarize PDFs, generate quizzes, and more!</p>
      <div className="feature-cards">
        <div className="card" onClick={() => navigate("/pdf-summarizer")}>
          <h3>📄 PDF Summarizer</h3>
          <p>Upload PDFs and get concise summaries in seconds.</p>
        </div>
        <div className="card" onClick={() => navigate("/quiz-generator")}>
          <h3>🧠 Quiz Generator</h3>
          <p>Generate quizzes based on your learning material.</p>
        </div>
        <div className="card" onClick={() => navigate("/chatbot")}>
          <h3>🤖 Chatbot</h3>
          <p>Interact with our AI chatbot for instant assistance.</p>
        </div>
        <div className="card" onClick={() => navigate("/youtube-summarizer")}>
          <h3>🎥 YouTube Summarizer</h3>
          <p>Summarize YouTube video transcripts effortlessly.</p>
        </div>
      </div>
    </div>
  );
}