import React, { useState } from "react";
import axios from "../api/api";

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return setError("Please enter a YouTube URL");
    setLoading(true);
    setError("");
    setSummary("");
    const isValidYouTubeUrl = (url) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);

if (!isValidYouTubeUrl(url)) {
  setError("Invalid YouTube URL");
  return;
}
    try {
      const res = await axios.post("/youtube-summary/", {
        transcript: url,
        user_id: "guest",            // can be replaced with auth user ID
        user_class: "general",
        board: "general",
      });

      if (res.data.error) setError(res.data.error);
      else setSummary(res.data.notes || "No summary available.");
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to summarize video. The video may not have captions."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>🎥 YouTube Video Summarizer</h2>
      <input
        type="text"
        placeholder="Paste YouTube video URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ marginBottom: "10px", display: "block" }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {summary && (
        <div style={{ marginTop: "20px" }}>
          <h3>Summary</h3>
          <div
            style={{
              padding: "15px",
              borderRadius: "5px",
              whiteSpace: "pre-wrap",
              lineHeight: "1.5",
            }}
          >
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
