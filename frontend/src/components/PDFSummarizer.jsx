import React, { useState } from "react";
import axios from "../api/api";

export default function PDFSummarizer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select a valid PDF file");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/summarize/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSummary(response.data.summary);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error processing PDF");
    } finally {
      setLoading(false);
    }
  };

  const parseFormattedText = (text) => {
    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, idx) => {
      if (line.trim() === "") return;
      if (/^\*\*(.+)\*\*:?$/.test(line.trim())) {
        const boldContent = line.match(/^\*\*(.+)\*\*/)[1];
        elements.push(
          <h4 key={idx} style={{ marginTop: "20px"}}>
            {boldContent}
          </h4>
        );
      }
      else if (/^\* .+/.test(line.trim())) {
        elements.push(
          <li key={idx} style={{ lineHeight: "1.6" }}>
            {line.replace(/^\* /, "")}
          </li>
        );
      }
      else if (/^\* \*\*(.+)\*\*:/.test(line.trim())) {
        const boldPart = line.match(/\*\*(.+?)\*\*/)[1];
        const rest = line.split(/\*\*(.+?)\*\*:/)[2] || "";
        elements.push(
          <li key={idx} style={{ lineHeight: "1.6" }}>
            <strong>{boldPart}:</strong> {rest.trim()}
          </li>
        );
      }
      else {
        elements.push(
          <p key={idx} style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1500px", margin: "auto auto" }}>
      <h2>Upload PDF for Summarization</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ marginBottom: "10px", display: "block" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Processing..." : "Summarize"}
      </button>

      {summary && !loading && (
        <div style={{marginTop: "20px", paddingLeft: "60px" }}>
          <h3>Summary</h3>
          <ul style={{ paddingLeft: "20px" }}>{parseFormattedText(summary)}</ul>
        </div>
      )}
    </div>
  );
}
