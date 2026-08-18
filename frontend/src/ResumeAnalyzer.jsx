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
        {/* PROFESSIONAL RESULT SECTION */}
        {/* ========================= */}

        {result && (
          <div className="results-container">

            {/* RESULT HEADER */}
            <div className="result-header-card">

              <div>
                <span className="result-badge">
                  ✓ Analysis Complete
                </span>

                <h2>Resume Analysis</h2>

                <p>
                  Your resume has been analyzed successfully.
                </p>
              </div>

              <div className="target-role-box">
                <span>Target Role</span>

                <strong>
                  {matchResult?.target_role || targetRole}
                </strong>
              </div>

            </div>


            {/* SCORE + STATS */}
            {matchResult && (
              <div className="result-summary">

                <div className="match-card">

                  <p className="result-label">
                    Resume Match Score
                  </p>

                  <div className="match-score">
                    {matchResult.score}%
                  </div>

                  <p className="score-description">
                    Based on your skills and target role
                  </p>

                </div>


                <div className="summary-stats">

                  <div className="summary-stat">
                    <strong>
                      {matchResult.matched_skills?.length || 0}
                    </strong>

                    <span>Matched Skills</span>
                  </div>


                  <div className="summary-stat">
                    <strong>
                      {matchResult.missing_skills?.length || 0}
                    </strong>

                    <span>Missing Skills</span>
                  </div>


                  <div className="summary-stat">
                    <strong>
                      {result.projects?.length || 0}
                    </strong>

                    <span>Projects</span>
                  </div>


                  <div className="summary-stat">
                    <strong>
                      {result.certifications?.length || 0}
                    </strong>

                    <span>Certifications</span>
                  </div>

                </div>

              </div>
            )}


            {/* MATCHED SKILLS */}
            {matchResult?.matched_skills?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon matched-icon">
                    ✓
                  </div>

                  <div>
                    <h2>Matched Skills</h2>

                    <p>
                      Skills that match your target job role.
                    </p>
                  </div>

                </div>


                <div className="result-skills matched">

                  {matchResult.matched_skills.map(
                    (skill, index) => (

                      <span key={index}>
                        ✓ {skill}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}


            {/* MISSING SKILLS */}
            {matchResult?.missing_skills?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon missing-icon">
                    !
                  </div>

                  <div>
                    <h2>Skills to Improve</h2>

                    <p>
                      Skills you should consider learning.
                    </p>
                  </div>

                </div>


                <div className="result-skills missing">

                  {matchResult.missing_skills.map(
                    (skill, index) => (

                      <span key={index}>
                        + {skill}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}


            {/* RECOMMENDATIONS */}
            {matchResult?.recommendations?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon recommendation-icon">
                    💡
                  </div>

                  <div>
                    <h2>Personalized Recommendations</h2>

                    <p>
                      Recommended areas to improve your profile.
                    </p>
                  </div>

                </div>


                <div className="recommendations-list">

                  {matchResult.recommendations.map(
                    (item, index) => (

                      <div
                        className="recommendation"
                        key={index}
                      >

                        <div className="recommendation-number">
                          {index + 1}
                        </div>

                        <div>

                          <h3>
                            {item.skill}
                          </h3>

                          <p>
                            {item.recommendation}
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {/* RESUME SKILLS */}
            {result.skills?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon skills-icon">
                    🛠
                  </div>

                  <div>
                    <h2>Your Resume Skills</h2>

                    <p>
                      Skills extracted from your resume.
                    </p>
                  </div>

                </div>


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
            {result.experience?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon experience-icon">
                    💼
                  </div>

                  <div>
                    <h2>Experience</h2>

                    <p>
                      Professional experience from your resume.
                    </p>
                  </div>

                </div>


                {result.experience.map(
                  (item, index) => (

                    <div
                      className="experience-item"
                      key={index}
                    >

                      {typeof item === "string" ? (

                        <p>{item}</p>

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
            {result.education?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon education-icon">
                    🎓
                  </div>

                  <div>
                    <h2>Education</h2>

                    <p>
                      Academic qualifications from your resume.
                    </p>
                  </div>

                </div>


                {result.education.map(
                  (education, index) => (

                    <div
                      className="education-item"
                      key={index}
                    >
                      🎓 {education}
                    </div>

                  )
                )}

              </div>

            )}


            {/* PROJECTS */}
            {result.projects?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon project-icon">
                    🚀
                  </div>

                  <div>
                    <h2>Projects</h2>

                    <p>
                      Projects identified from your resume.
                    </p>
                  </div>

                </div>


                {result.projects.map(
                  (project, index) => (

                    <div
                      className="project-item"
                      key={index}
                    >

                      {typeof project === "string" ? (

                        <p>{project}</p>

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
            {result.certifications?.length > 0 && (

              <div className="result-card">

                <div className="result-card-title">

                  <div className="section-icon certificate-icon">
                    🏆
                  </div>

                  <div>
                    <h2>Certifications</h2>

                    <p>
                      Certifications found in your resume.
                    </p>
                  </div>

                </div>


                {result.certifications.map(
                  (certificate, index) => (

                    <div
                      className="certificate-item"
                      key={index}
                    >
                      🏆 {certificate}
                    </div>

                  )
                )}

              </div>

            )}


            {/* ACTION BUTTONS */}
            <div className="result-actions">

              <button
                className="analyze-again-btn"
                onClick={() => {
                  setResume(null);
                  setResult(null);
                  setMatchResult(null);
                  setError("");
                }}
              >
                ↻ Analyze Another Resume
              </button>


              <button
                className="dashboard-result-btn"
                onClick={onBack}
              >
                ← Back to Dashboard
              </button>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default ResumeAnalyzer;