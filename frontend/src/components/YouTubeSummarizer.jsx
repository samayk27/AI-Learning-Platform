import React, { useState } from "react";
import axios from "../api/api";

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setSummary("");

    try {
      const response = await axios.post("/youtube-summary/", { transcript: url });
      setSummary(response.data.summary || "No summary available.");
    } catch (error) {
      setSummary("Error summarizing the video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>YouTube Summarizer</h2>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter YouTube video URL"
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button onClick={handleSummarize} style={{ padding: "10px 20px" }}>
        {loading ? "Summarizing..." : "Summarize"}
      </button>
      {summary && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd" }}>
          <h3>Summary</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
