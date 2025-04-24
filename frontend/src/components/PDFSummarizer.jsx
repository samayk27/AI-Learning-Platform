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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload PDF for Summarization</h2>
      
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ marginBottom: "10px", display: "block" }}
      />
      
      {/* Error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white" }}
      >
        {loading ? "Processing..." : "Summarize"}
      </button>

      {/* Summary display */}
      {summary && !loading && (
        <div style={{ marginTop: "20px" }}>
          <h3>Summary</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
