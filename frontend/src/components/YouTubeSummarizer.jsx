import React, { useState } from "react";
import axios from "../api/api";

export default function YouTubeSummarizer() {
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post("/youtube-summary/", { transcript });
    setNotes(res.data.notes);
  };

  return (
    <div>
      <h2>YouTube Notes</h2>
      <input
        type="text"
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        style={{ width: "100%" }}
      />
      <button>Generate Notes</button>
      <p>{notes}</p>
    </div>
  );
}
