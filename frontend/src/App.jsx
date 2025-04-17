import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ChatBot from "./components/ChatBot";
import PDFSummarizer from "./components/PDFSummarizer";
import QuizGenerator from "./components/QuizGenerator";
import YouTubeSummarizer from "./components/YouTubeSummarizer";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1 className="nav-brand">📚 AI Tutoring System</h1>
          <ul className="nav-links">
            <li><Link to="/chat">Chat Bot</Link></li>
            <li><Link to="/pdf">PDF Summarizer</Link></li>
            <li><Link to="/youtube">YouTube Summarizer</Link></li>
            <li><Link to="/quiz">Quiz Generator</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ChatBot />} />
            <Route path="/chat" element={<ChatBot />} />
            <Route path="/pdf" element={<PDFSummarizer />} />
            <Route path="/youtube" element={<YouTubeSummarizer />} />
            <Route path="/quiz" element={<QuizGenerator />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
