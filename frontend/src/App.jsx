import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./components/HomePage";
import PDFSummarizer from "./components/PDFSummarizer";
import QuizGenerator from "./components/QuizGenerator";
import Chatbot from "./components/Chatbot";
import YouTubeSummarizer from "./components/YouTubeSummarizer";
import Footer from "./components/Footer"; // Import Footer
import "./App.css";
import "./Navbar.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-logo">AI Education Assistant</div>
          <div className="navbar-links">
            <NavLink to="/" className="nav-link" activeClassName="active-link">
              Home
            </NavLink>
            <NavLink to="/pdf-summarizer" className="nav-link" activeClassName="active-link">
              PDF Summarizer
            </NavLink>
            <NavLink to="/quiz-generator" className="nav-link" activeClassName="active-link">
              Quiz Generator
            </NavLink>
            <NavLink to="/chatbot" className="nav-link" activeClassName="active-link">
              Chatbot
            </NavLink>
            <NavLink to="/youtube-summarizer" className="nav-link" activeClassName="active-link">
              YouTube Summarizer
            </NavLink>
          </div>
        </nav>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pdf-summarizer" element={<PDFSummarizer />} />
            <Route path="/quiz-generator" element={<QuizGenerator />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/youtube-summarizer" element={<YouTubeSummarizer />} />
          </Routes>
        </div>
        <Footer /> {/* Footer stays at the bottom */}
      </div>
    </Router>
  );
}

export default App;


