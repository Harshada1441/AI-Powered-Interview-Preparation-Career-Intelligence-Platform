import { useEffect, useState } from "react";
import "./InterviewSetup.css";

function InterviewSetup({ onBack, onInterviewStart }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  const [role, setRole] = useState("Data Scientist");
  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState(10);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [error, setError] = useState("");

  // Load user's uploaded resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please login again.");
        }

        const response = await fetch(
          "http://127.0.0.1:8000/api/resumes/list/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(

            data.detail || "Unable to load resumes."
          );
        }

        setResumes(data);

        if (data.length > 0) {
          setSelectedResume(String(data[0].id));
        }
      } catch (error) {
        console.error("Resume loading error:", error);
        setError(error.message);
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, []);

  const handleStartInterview = async () => {
    setError("");

    if (!selectedResume) {
      setError("Please select a resume first.");
      return;
    }

    setLoadingInterview(true);

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
            resume_id: Number(selectedResume),
            role: role,
            difficulty: difficulty,
            total_questions: Number(totalQuestions),
          }),
        }
      );

      const data = await response.json();

      console.log("Interview API response:", data);

      
      if (!response.ok) {
        throw new Error(
          `${data.detail || "Failed to create interview."}${
            data.error ? `\n${data.error}` : ""
          }`
        );
      }

      onInterviewStart(data);

    } catch (error) {
      console.error("Interview creation error:", error);
      setError(error.message);
    } finally {
      setLoadingInterview(false);
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
          disabled={loadingInterview}
        >
          ← Dashboard
        </button>

      </nav>

      <main className="interview-setup-content">

        <div className="setup-header">

          <div className="setup-icon">
            🤖
          </div>

          <h1>AI Interview Setup</h1>

          <p>
            Your resume + target role will be used to
            create a personalized AI interview.
          </p>

        </div>

        <div className="setup-card">

          {error && (
            <div className="interview-error">
              {error}
            </div>
          )}

          {/* Resume */}

          <div className="form-group">

            <label>
              Select Your Resume
            </label>

            {loadingResumes ? (
              <div className="loading-text">
                Loading your resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="no-resume-box">
                No uploaded resume found.
                Please upload your resume first.
              </div>
            ) : (
              <select
                value={selectedResume}
                onChange={(event) =>
                  setSelectedResume(event.target.value)
                }
                disabled={loadingInterview}
              >
                <option value="">
                  Select a resume
                </option>

                {resumes.map((resume) => (
                  <option
                    key={resume.id}
                    value={resume.id}
                  >
                    {resume.title}
                  </option>
                ))}
              </select>
            )}

          </div>

          {/* Role */}

          <div className="form-group">

            <label>
              Target Job Role
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              disabled={loadingInterview}
            >
              <option value="Data Scientist">
                Data Scientist
              </option>

              <option value="Data Analyst">
                Data Analyst
              </option>

              <option value="Python Developer">
                Python Developer
              </option>

              <option value="ML Engineer">
                ML Engineer
              </option>

              <option value="AI Engineer">
                AI Engineer
              </option>
            </select>

          </div>

          {/* Difficulty */}

          <div className="form-group">

            <label>
              Interview Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value)
              }
              disabled={loadingInterview}
            >
              <option value="easy">
                Easy
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="hard">
                Hard
              </option>
            </select>

          </div>

          {/* Questions */}

          <div className="form-group">

            <label>
              Number of Questions
            </label>

            <select
              value={totalQuestions}
              onChange={(event) =>
                setTotalQuestions(event.target.value)
              }
              disabled={loadingInterview}
            >
              <option value="5">
                5 Questions
              </option>

              <option value="10">
                10 Questions
              </option>

              <option value="15">
                15 Questions
              </option>
            </select>

          </div>

          <button
            className="start-interview-btn"
            onClick={handleStartInterview}
            disabled={
              loadingInterview ||
              loadingResumes ||
              resumes.length === 0
            }
          >
            {loadingInterview
              ? "⏳ Generating Interview..."
              : "🚀 Start AI Interview →"}
          </button>

        </div>

        <div className="setup-info">

          <div>
            <span>📄</span>
            <strong>Resume Based</strong>
            <p>
              AI uses your uploaded resume
            </p>
          </div>

          <div>
            <span>🎯</span>
            <strong>Role Based</strong>
            <p>
              Questions match your target role
            </p>
          </div>

          <div>
            <span>🤖</span>
            <strong>AI Generated</strong>
            <p>
              Personalized interview questions
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}

export default InterviewSetup;