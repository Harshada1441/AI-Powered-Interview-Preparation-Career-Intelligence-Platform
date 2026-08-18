import "./Dashboard.css";

function Dashboard({ onAnalyzeResume }) {
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="dashboard-logo">
          🤖 AI Interview Portal
        </div>

        <button className="logout-btn">
          Logout
        </button>
      </nav>

      <main className="dashboard-content">
        <h1>Welcome to your Dashboard 👋</h1>

        <p>
          Analyze your resume and prepare for your next interview.
        </p>

        <div className="dashboard-grid">

          <div className="dashboard-card">
            <div className="dashboard-icon">📄</div>

            <h2>Resume Analyzer</h2>

            <p>
              Upload your resume and analyze your skills,
              experience, projects and education.
            </p>

            <button onClick={onAnalyzeResume}>
              Analyze Resume →
            </button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">🎯</div>

            <h2>Job Match</h2>

            <p>
              Check how well your resume matches your target
              job role.
            </p>

            <button>
              Check Match →
            </button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">💡</div>

            <h2>Recommendations</h2>

            <p>
              Discover missing skills and improve your resume.
            </p>

            <button>
              View Recommendations →
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;