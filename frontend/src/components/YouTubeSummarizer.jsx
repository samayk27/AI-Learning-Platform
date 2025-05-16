import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "../api/api";

export default function YouTubeSummarizer() {
  const { user, isSignedIn } = useUser();
  const [url, setUrl] = useState(() => localStorage.getItem("youtube_last_url") || "");
  const [summary, setSummary] = useState(() => localStorage.getItem("youtube_last_summary") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSummaries, setRecentSummaries] = useState(() => {
    const saved = localStorage.getItem(`youtube_summaries_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save URL and summary to localStorage
  useEffect(() => {
    if (url) localStorage.setItem("youtube_last_url", url);
  }, [url]);

  useEffect(() => {
    if (summary) localStorage.setItem("youtube_last_summary", summary);
  }, [summary]);

  // Save recent summaries for logged-in users
  useEffect(() => {
    if (isSignedIn && user?.id) {
      localStorage.setItem(`youtube_summaries_${user.id}`, JSON.stringify(recentSummaries));
    }
  }, [recentSummaries, isSignedIn, user?.id]);

  const handleSummarize = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/youtube-summary/", { 
        transcript: url,
        user_id: isSignedIn ? user.id : 'guest',
        user_class: 'general',  // Default value
        board: 'general'  // Default value
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const newSummary = response.data.notes || "No summary available.";
      setSummary(newSummary);

      // Add to recent summaries if user is signed in
      if (isSignedIn && newSummary !== "No summary available.") {
        setRecentSummaries(prev => {
          const updated = [
            {
              url,
              summary: newSummary,
              timestamp: new Date().toISOString()
            },
            ...prev
          ].slice(0, 10); // Keep only last 10 summaries
          return updated;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error summarizing the video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setRecentSummaries([]);
    localStorage.removeItem(`youtube_summaries_${user?.id}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>📺 YouTube Video Summarizer</h2>
      
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

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube video URL"
          style={{ 
            width: "100%", 
            padding: "12px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "10px"
          }}
        />
        <button 
          onClick={handleSummarize} 
          disabled={loading}
          style={{ 
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      {summary && (
        <div style={{ 
          marginTop: "20px", 
          padding: "20px", 
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}>
          <h3>Summary</h3>
          <div style={{ whiteSpace: "pre-wrap" }}>{summary}</div>
        </div>
      )}

      {isSignedIn && recentSummaries.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "15px"
          }}>
            <h3 style={{ margin: 0 }}>Recent Summaries</h3>
            <button
              onClick={clearHistory}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Clear History
            </button>
          </div>
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px" 
          }}>
            {recentSummaries.map((item, index) => (
              <div 
                key={index}
                style={{ 
                  padding: "15px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: "10px"
                }}>
                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#007bff" }}
                  >
                    {item.url}
                  </a>
                  <span style={{ color: "#666" }}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ 
                  maxHeight: "100px", 
                  overflow: "auto",
                  fontSize: "0.9em",
                  color: "#666"
                }}>
                  {item.summary.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
