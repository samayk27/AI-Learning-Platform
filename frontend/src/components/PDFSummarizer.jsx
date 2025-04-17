import React, { useState } from "react";
import axios from "../api/api";

export default function PDFSummarizer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("/summarize/", formData);
    setSummary(res.data.summary);
  };

  return (
    <div>
      <h2>Upload PDF</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleSubmit}>Summarize</button>
      <p>{summary}</p>
    </div>
  );
}
