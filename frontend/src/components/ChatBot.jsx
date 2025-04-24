import React, { useState } from "react";
import axios from "../api/api";

export default function ChatBot() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question || !context) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("question", question);
    formData.append("context", context);

    try {
      const res = await axios.post("/document-qa/", formData);
      setAnswer(res.data.answer);
    } catch (error) {
      setAnswer("An error occurred while getting an answer.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>💬 AI Tutor Chat</h2>
      <input
        type="text"
        placeholder="Paste relevant chapter or notes here"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        style={{ width: "100%" }}
      />
      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "100%" }}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </button>

      {answer && (
        <div style={{ background: "#f5f5f5" }}>
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
