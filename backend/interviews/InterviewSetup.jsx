import { useState } from "react";
import "./InterviewSetup.css";

function InterviewSetup({ onBack, onInterviewStart }) {
  const [role, setRole] = useState("Data Scientist");
  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartInterview = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/interviews/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
            difficulty,
            total_questions: totalQuestions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create interview."
        );
      }

      onInterviewStart(data);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-setup-page">

      <nav className="interview-nav">
        <div className="interview-logo">
          🤖 AI Interview Portal
        </div>

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Dashboard
        </button>
      </nav>

      <main className="interview-setup-content">

        <div className="setup-header">
          <div className="setup-icon">
            🤖
          </div>

          <h1>AI Interview</h1>

          <p>
            Practice a personalized interview generated
            by AI based on your target role.
          </p>
        </div>

        <div className="setup-card">

          <div className="form-group">
            <label>Target Job Role</label>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
            >
              <option>Data Scientist</option>
              <option>Data Analyst</option>
              <option>Machine Learning Engineer</option>
              <option>Python Developer</option>
              <option>AI Engineer</option>
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value)
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Questions</label>

            <select
              value={totalQuestions}
              onChange={(event) =>
                setTotalQuestions(Number(event.target.value))
              }
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
            </select>
          </div>

          {error && (
            <div className="interview-error">
              {error}
            </div>
          )}

          <button
            className="start-interview-btn"
            onClick={handleStartInterview}
            disabled={loading}
          >
            {loading
              ? "🤖 Generating Questions..."
              : "🚀 Start AI Interview →"}
          </button>

        </div>

        <div className="setup-info">

          <div>
            <span>🤖</span>
            <strong>AI Generated</strong>
            <p>Questions based on your role</p>
          </div>

          <div>
            <span>🎯</span>
            <strong>Role Focused</strong>
            <p>Practice relevant interview topics</p>
          </div>

          <div>
            <span>📊</span>
            <strong>Performance</strong>
            <p>Get detailed feedback after interview</p>
          </div>

        </div>

      </main>
    </div>
  );
}

export default InterviewSetup;