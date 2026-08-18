import { useState } from "react";
import "./ResumeAnalyzer.css";

function ResumeAnalyzer({ onBack }) {
  const [resume, setResume] = useState(null);
  const [targetRole, setTargetRole] = useState("Data Scientist");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // -----------------------------
  // File Selection
  // -----------------------------

  const handleFileChange = (event) => {
    setResume(event.target.files[0]);
    setError("");
    setResult(null);
    setMatchResult(null);
  };

  // -----------------------------
  // Analyze Resume
  // -----------------------------

  const handleAnalyze = async () => {
    if (!resume) {
      setError("Please upload your resume first.");
      return;
    }

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // =============================
      // STEP 1 — Upload Resume
      // =============================

      const formData = new FormData();


      formData.append("title", resume.name);
      formData.append("file", resume);

      const uploadResponse = await fetch(
        "http://127.0.0.1:8000/api/resumes/upload/",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      console.log("Upload Response:", uploadData);

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.detail ||
          uploadData.file?.[0] ||
          "Resume upload failed."
        );
      }

      const resumeId = uploadData.id;

      // =============================
      // STEP 2 — Set Target Role
      // =============================

      const roleResponse = await fetch(
        `http://127.0.0.1:8000/api/resumes/${resumeId}/target-role/`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            target_role: targetRole,
          }),
        }
      );

      const roleData = await roleResponse.json();

      console.log("Role Response:", roleData);

      if (!roleResponse.ok) {
        throw new Error(
          roleData.detail ||
          "Unable to set target role."
        );
      }

      // =============================
      // STEP 3 — Get Resume Analysis
      // =============================

      const analysisResponse = await fetch(
        `http://127.0.0.1:8000/api/resumes/${resumeId}/analysis/`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const analysisData = await analysisResponse.json();

      console.log("Analysis Response:", analysisData);

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.detail ||
          "Resume analysis failed."
        );
      }

      setResult(analysisData);

      // =============================
      // STEP 4 — Get Match Result
      // =============================

      const matchResponse = await fetch(
        `http://127.0.0.1:8000/api/resumes/${resumeId}/match/`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const matchData = await matchResponse.json();

      console.log("Match Response:", matchData);

      if (!matchResponse.ok) {
        throw new Error(
          matchData.detail ||
          "Unable to calculate job match."
        );
      }

      setMatchResult(matchData);

    } catch (error) {
      console.error("Resume Analysis Error:", error);

      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-page">

      {/* NAVBAR */}

      <nav className="resume-nav">

        <div className="resume-logo">
          🤖 AI Interview Portal
        </div>

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Dashboard
        </button>

      </nav>


      <main className="resume-content">

        {/* HEADER */}

        <div className="resume-header">

          <h1>
            Resume Analyzer 📄
          </h1>

          <p>
            Upload your resume and discover your skills,
            experience, projects and job match.
          </p>

        </div>


        {/* UPLOAD SECTION */}

        {!result && (

          <>

            <div className="upload-card">

              <div className="upload-icon">
                📄
              </div>

              <h2>
                Upload Your Resume
              </h2>

              <p>
                Upload your PDF resume to analyze your profile.
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />

              {resume && (

                <p className="selected-file">
                  Selected: {resume.name}
                </p>

              )}

            </div>


            {/* TARGET ROLE */}

            <div className="role-card">

              <label>
                Target Job Role
              </label>

              <select
                value={targetRole}
                onChange={(event) =>
                  setTargetRole(event.target.value)
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

              </select>

            </div>


            {/* ERROR */}

            {error && (

              <p className="analysis-error">
                {error}
              </p>

            )}


            {/* ANALYZE BUTTON */}

            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >

              {loading
                ? "Analyzing Resume..."
                : "🔍 Analyze Resume"}

            </button>

          </>

        )}


        {/* ========================= */}
        {/* RESULT SECTION */}
        {/* ========================= */}

        {result && (

          <div className="results-container">

            {/* MATCH SCORE */}

            {matchResult && (

              <div className="match-card">

                <p className="result-label">
                  Target Role
                </p>

                <h2>
                  {matchResult.target_role || targetRole}
                </h2>

                <div className="match-score">
                  {matchResult.score}%
                </div>

                <p>
                  Resume Match Score
                </p>

              </div>

            )}


            {/* MATCHED SKILLS */}

            {matchResult?.matched_skills && (

              <div className="result-card">

                <h2>
                  ✓ Matched Skills
                </h2>

                <div className="result-skills matched">

                  {matchResult.matched_skills.map(
                    (skill, index) => (

                      <span key={index}>
                        {skill}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}


            {/* MISSING SKILLS */}

            {matchResult?.missing_skills && (

              <div className="result-card">

                <h2>
                  ! Missing Skills
                </h2>

                <div className="result-skills missing">

                  {matchResult.missing_skills.map(
                    (skill, index) => (

                      <span key={index}>
                        {skill}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}


            {/* RECOMMENDATIONS */}

            {matchResult?.recommendations && (

              <div className="result-card">

                <h2>
                  💡 Recommendations
                </h2>

                {matchResult.recommendations.map(
                  (item, index) => (

                    <div
                      className="recommendation"
                      key={index}
                    >

                      <h3>
                        {item.skill}
                      </h3>

                      <p>
                        {item.recommendation}
                      </p>

                    </div>

                  )
                )}

              </div>

            )}


            {/* SKILLS */}

            {result.skills && (

              <div className="result-card">

                <h2>
                  🛠 Skills
                </h2>

                <div className="result-skills">

                  {result.skills.map(
                    (skill, index) => (

                      <span key={index}>
                        {skill}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}


            {/* EXPERIENCE */}

            {result.experience && (

              <div className="result-card">

                <h2>
                  💼 Experience
                </h2>

                {result.experience.map(
                  (item, index) => (

                    <div
                      className="experience-item"
                      key={index}
                    >

                      {typeof item === "string" ? (

                        <p>
                          {item}
                        </p>

                      ) : (

                        <>
                          <h3>
                            {item.role}
                          </h3>

                          {item.responsibilities?.map(
                            (responsibility, i) => (

                              <p key={i}>
                                • {responsibility}
                              </p>

                            )
                          )}

                        </>

                      )}

                    </div>

                  )
                )}

              </div>

            )}


            {/* EDUCATION */}

            {result.education && (

              <div className="result-card">

                <h2>
                  🎓 Education
                </h2>

                {result.education.map(
                  (education, index) => (

                    <p key={index}>
                      • {education}
                    </p>

                  )
                )}

              </div>

            )}


            {/* PROJECTS */}

            {result.projects && (

              <div className="result-card">

                <h2>
                  🚀 Projects
                </h2>

                {result.projects.map(
                  (project, index) => (

                    <div
                      className="project-item"
                      key={index}
                    >

                      {typeof project === "string" ? (

                        <p>
                          {project}
                        </p>

                      ) : (

                        <>
                          <h3>
                            {project.name}
                          </h3>

                          <p>
                            {project.description?.join(" ")}
                          </p>
                        </>

                      )}

                    </div>

                  )
                )}

              </div>

            )}


            {/* CERTIFICATIONS */}

            {result.certifications && (

              <div className="result-card">

                <h2>
                  🏆 Certifications
                </h2>

                {result.certifications.map(
                  (certificate, index) => (

                    <p key={index}>
                      • {certificate}
                    </p>

                  )
                )}

              </div>

            )}


            {/* ANALYZE AGAIN */}

            <button
              className="analyze-again-btn"
              onClick={() => {
                setResume(null);
                setResult(null);
                setMatchResult(null);
                setError("");
              }}
            >
              Analyze Another Resume
            </button>

          </div>

        )}

      </main>

    </div>
  );
}

export default ResumeAnalyzer;