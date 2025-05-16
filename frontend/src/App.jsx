import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./components/HomePage";
import PDFSummarizer from "./components/PDFSummarizer";
import QuizGenerator from "./components/QuizGenerator";
import Chatbot from "./components/Chatbot";
import YouTubeSummarizer from "./components/YouTubeSummarizer";
import Footer from "./components/Footer";
import "./App.css";
import "./Navbar.css";
import { ClerkProvider, SignIn, SignUp, UserButton, useUser } from "@clerk/clerk-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function NavbarContent() {
  const { isSignedIn, user } = useUser();

  return (
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
      <div className="auth-buttons">
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <>
            <NavLink to="/sign-in" className="auth-button">Sign In</NavLink>
            <NavLink to="/sign-up" className="auth-button">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      navigate={(to) => window.location.href = to}
    >
      <Router>
        <div className="app-container">
          <NavbarContent />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/sign-in/*" 
                element={
                  <SignIn 
                    routing="path" 
                    path="/sign-in" 
                    redirectUrl="/"
                    signUpUrl="/sign-up"
                  />
                } 
              />
              <Route 
                path="/sign-up/*" 
                element={
                  <SignUp 
                    routing="path" 
                    path="/sign-up" 
                    redirectUrl="/"
                    signInUrl="/sign-in"
                  />
                } 
              />
              <Route path="/pdf-summarizer" element={<PDFSummarizer />} />
              <Route path="/quiz-generator" element={<QuizGenerator />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/youtube-summarizer" element={<YouTubeSummarizer />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;


