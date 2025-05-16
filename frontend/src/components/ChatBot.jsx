import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "../api/api";

export default function ChatBot() {
  const { user, isSignedIn } = useUser();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`chatbot_messages_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Save messages for logged-in users
  useEffect(() => {
    if (isSignedIn && user?.id) {
      localStorage.setItem(`chatbot_messages_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, isSignedIn, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault(); // Handle both button click and form submit
    
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("question", question);

    try {
      const res = await axios.post("/document-qa/", formData);
      
      if (res.data.error) {
        throw new Error(res.data.error);
      }

      const newMessage = {
        question,
        answer: res.data.answer,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
      setQuestion(""); // Clear question after sending
    } catch (error) {
      console.error(error);
      setError(error.message || "An error occurred while getting an answer.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(`chatbot_messages_${user?.id}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>💬 AI Tutor Chat</h2>

      {error && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          borderRadius: "4px",
          marginBottom: "20px" 
        }}>
          {error}
        </div>
      )}

      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "20px" 
      }}>
        {messages.length > 0 && (
          <div style={{ 
            marginBottom: "20px",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",  
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 15px",
              borderBottom: "1px solid #ddd",
            }}>
              <h3 style={{ margin: 0 }}>Chat History</h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: "6px 12px",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Clear History
              </button>
            </div>
            <div style={{ padding: "15px" }}>
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  style={{ 
                    marginBottom: "20px",
                    borderBottom: index < messages.length - 1 ? "1px solid #eee" : "none",
                    paddingBottom: "15px"
                  }}
                >
                  <div style={{ 
                    
                    padding: "10px",
                    borderRadius: "4px",
                    marginBottom: "10px"
                  }}>
                    <strong>Q: </strong>{msg.question}
                  </div>
                  <div style={{ 
                    
                    padding: "10px",
                    borderRadius: "4px"
                  }}>
                    <strong>A: </strong>{msg.answer}
                  </div>
                  <div style={{ 
                    fontSize: "0.8em",
                    color: "#666",
                    marginTop: "5px",
                    textAlign: "right"
                  }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ 
          display: "flex", 
          gap: "10px",
          alignItems: "flex-start"
        }}>
          <input
            type="text"
            placeholder="Ask me anything..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ 
              flex: 1,
              padding: "12px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
          />
          <button 
            type="submit"
            disabled={loading}
            style={{ 
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
