import { useEffect, useState } from "react";
import "./InterviewSetup.css";

function InterviewSetup({ onBack, onInterviewStart }) {
  const [mode, setMode] = useState("resume");

  const [role, setRole] = useState("Data Scientist");
  const [topic, setTopic] = useState("");

  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState(10);

  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");

  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // -----------------------------------------
  // Load user's resumes
  // -----------------------------------------

  useEffect(() => {
    if (mode !== "resume") {
      return;
    }

    const fetchResumes = async () => {
      setLoadingResumes(true);
      setError("");

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

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          let errorMessage = `Failed to load resumes (${response.status}).`;

          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage =
              errorData.detail ||
              errorData.error ||
              errorMessage;
          } else {
            const errorText = await response.text();
            console.error("Resume API response:", errorText);
          }

          throw new Error(errorMessage);
        }

        if (!contentType.includes("application/json")) {
          const errorText = await response.text();
          console.error("Unexpected Resume API response:", errorText);
          throw new Error(
            "Resume API returned an unexpected response."
          );
        }

        const data = await response.json();

        // Support common API response formats
        const resumeList = Array.isArray(data)
          ? data
          : data.results || data.resumes || [];

        setResumes(resumeList);

        if (resumeList.length > 0) {
          setResumeId(String(resumeList[0].id));
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, [mode]);

  // -----------------------------------------
  // Handle mode change
  // -----------------------------------------

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    setError("");

    if (selectedMode === "resume") {
      setTopic("");
    }

    if (selectedMode === "topic") {
      setResumeId("");
    }

    if (selectedMode === "hr") {
      setResumeId("");
      setTopic("");
    }
  };

  // -----------------------------------------
  // Start Interview
  // -----------------------------------------

  const handleStartInterview = async () => {
    setError("");

    // -----------------------------------------
    // Frontend validation
    // -----------------------------------------

    if (mode === "resume") {
      if (!resumeId) {
        setError("Please select a resume.");
        return;
      }

      if (!role.trim()) {
        setError("Please select a target job role.");
        return;
      }
    }

    if (mode === "topic") {
      if (!topic.trim()) {
        setError("Please select or enter a topic.");
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please login again.");
      }

      const requestBody = {
        mode,
        role: mode === "resume" ? role : "",
        topic: mode === "topic" ? topic.trim() : "",
        difficulty,
        total_questions: totalQuestions,
      };

      // Resume ID is only required for resume mode
      if (mode === "resume") {
        requestBody.resume_id = Number(resumeId);
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/interviews/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to create interview."
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

      {/* NAVBAR */}

      <nav className="interview-nav">

        <div className="interview-logo">
          🤖 AI Interview Portal
        </div>

        <button
          className="back-btn"
          onClick={onBack}
          disabled={loading}
        >
          ← Dashboard
        </button>

      </nav>

      {/* MAIN */}

      <main className="interview-setup-content">

        {/* HEADER */}

        <div className="setup-header">

          <div className="setup-icon">
            🤖
          </div>

          <h1>AI Interview</h1>

          <p>
            Choose your interview type and practice
            with an AI-powered interviewer.
          </p>

        </div>

        {/* SETUP CARD */}

        <div className="setup-card">

          {/* ----------------------------------- */}
          {/* INTERVIEW MODE */}
          {/* ----------------------------------- */}

          <div className="form-group">

            <label>
              Interview Type
            </label>

            <div className="interview-mode-grid">

              <button
                type="button"
                className={`mode-card ${
                  mode === "resume"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleModeChange("resume")
                }
              >
                <span className="mode-icon">
                  📄
                </span>

                <strong>
                  Resume Based
                </strong>

                <small>
                  Questions based on your resume
                </small>
              </button>

              <button
                type="button"
                className={`mode-card ${
                  mode === "topic"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleModeChange("topic")
                }
              >
                <span className="mode-icon">
                  🎯
                </span>

                <strong>
                  Topic Based
                </strong>

                <small>
                  Practice a specific topic
                </small>
              </button>

              <button
                type="button"
                className={`mode-card ${
                  mode === "hr"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleModeChange("hr")
                }
              >
                <span className="mode-icon">
                  👔
                </span>

                <strong>
                  HR Interview
                </strong>

                <small>
                  HR & behavioral questions
                </small>
              </button>

            </div>

          </div>

          {/* ----------------------------------- */}
          {/* RESUME MODE */}
          {/* ----------------------------------- */}

          {mode === "resume" && (
            <>
              <div className="form-group">

                <label>
                  Select Resume
                </label>

                {loadingResumes ? (
                  <div className="field-loading">
                    Loading your resumes...
                  </div>
                ) : resumes.length > 0 ? (
                  <select
                    value={resumeId}
                    onChange={(event) =>
                      setResumeId(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select a resume
                    </option>

                    {resumes.map((resume) => (
                      <option
                        key={resume.id}
                        value={resume.id}
                      >
                        {resume.title ||
                          resume.name ||
                          resume.filename ||
                          `Resume #${resume.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="no-resume-message">
                    No resume found. Please upload
                    a resume first.
                  </div>
                )}

              </div>

              <div className="form-group">

                <label>
                  Target Job Role
                </label>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                >
                  <option>
                    Data Scientist
                  </option>

                  <option>
                    Data Analyst
                  </option>

                  <option>
                    Machine Learning Engineer
                  </option>

                  <option>
                    Python Developer
                  </option>

                  <option>
                    AI Engineer
                  </option>

                  <option>
                    Software Developer
                  </option>
                </select>

              </div>
            </>
          )}

          {/* ----------------------------------- */}
          {/* TOPIC MODE */}
          {/* ----------------------------------- */}

          {mode === "topic" && (
            <>

              <div className="form-group">

                <label>
                  Select Topic
                </label>

                <select
                  value={
                    [
                      "Python",
                      "SQL",
                      "Machine Learning",
                      "Data Science",
                      "Data Analysis",
                      "Statistics",
                      "Power BI",
                      "Deep Learning",
                      "Generative AI",
                      "Agentic AI",
                      "Django",
                      "React",
                      "JavaScript",
                    ].includes(topic)
                      ? topic
                      : ""
                  }
                  onChange={(event) =>
                    setTopic(event.target.value)
                  }
                >
                  <option value="">
                    Choose a topic
                  </option>

                  <option>Python</option>
                  <option>SQL</option>
                  <option>Machine Learning</option>
                  <option>Data Science</option>
                  <option>Data Analysis</option>
                  <option>Statistics</option>
                  <option>Power BI</option>
                  <option>Deep Learning</option>
                  <option>Generative AI</option>
                  <option>Agentic AI</option>
                  <option>Django</option>
                  <option>React</option>
                  <option>JavaScript</option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Or Enter Custom Topic
                </label>

                <input
                  type="text"
                  value={
                    [
                      "Python",
                      "SQL",
                      "Machine Learning",
                      "Data Science",
                      "Data Analysis",
                      "Statistics",
                      "Power BI",
                      "Deep Learning",
                      "Generative AI",
                      "Agentic AI",
                      "Django",
                      "React",
                      "JavaScript",
                    ].includes(topic)
                      ? ""
                      : topic
                  }
                  onChange={(event) =>
                    setTopic(event.target.value)
                  }
                  placeholder="Example: Feature Engineering"
                />

              </div>

            </>
          )}

          {/* ----------------------------------- */}
          {/* HR MODE */}
          {/* ----------------------------------- */}

          {mode === "hr" && (
            <div className="hr-info-box">

              <div className="hr-info-icon">
                👔
              </div>

              <div>
                <strong>
                  HR & Behavioral Interview
                </strong>

                <p>
                  You will be asked questions about
                  communication, teamwork, strengths,
                  weaknesses, career goals and
                  workplace situations.
                </p>
              </div>

            </div>
          )}

          {/* ----------------------------------- */}
          {/* DIFFICULTY */}
          {/* ----------------------------------- */}

          <div className="form-group">

            <label>
              Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value
                )
              }
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

          {/* ----------------------------------- */}
          {/* QUESTIONS */}
          {/* ----------------------------------- */}

          <div className="form-group">

            <label>
              Number of Questions
            </label>

            <select
              value={totalQuestions}
              onChange={(event) =>
                setTotalQuestions(
                  Number(event.target.value)
                )
              }
            >
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
            </select>

            <small className="question-note">
              Self Introduction is mandatory and
              will be asked before these questions.
            </small>

          </div>

          {/* ERROR */}

          {error && (
            <div className="interview-error">
              {error}
            </div>
          )}

          {/* START */}

          <button
            className="start-interview-btn"
            onClick={handleStartInterview}
            disabled={
              loading ||
              loadingResumes ||
              (
                mode === "resume" &&
                resumes.length === 0
              )
            }
          >
            {loading
              ? "🤖 Generating Questions..."
              : "🚀 Start AI Interview →"}
          </button>

        </div>

        {/* INFO */}

        <div className="setup-info">

          <div>
            <span>🗣️</span>

            <strong>
              Self Introduction
            </strong>

            <p>
              Every interview starts with
              your introduction.
            </p>
          </div>

          <div>
            <span>🤖</span>

            <strong>
              AI Generated
            </strong>

            <p>
              Natural questions based on
              your selected interview type.
            </p>
          </div>

          <div>
            <span>📊</span>

            <strong>
              Performance
            </strong>

            <p>
              Get score and detailed AI
              feedback after your interview.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}

export default InterviewSetup;