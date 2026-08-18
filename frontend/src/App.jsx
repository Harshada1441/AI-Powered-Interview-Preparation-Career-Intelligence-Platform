import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Register from "./Register";
import ResumeAnalyzer from "./ResumeAnalyzer";


function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);



  // Resume Analyzer
  if (showResumeAnalyzer) {
    return (
      <ResumeAnalyzer
        onBack={() => setShowResumeAnalyzer(false)}
      />
    );
  }
  
  // Dashboard
  if (showDashboard) {
    return (
      <Dashboard
        onAnalyzeResume={() => setShowResumeAnalyzer(true)}
      />
    );
  }

  //register
  if (showRegister) {
    return (
      <Register
        onRegisterSuccess={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
        onBackToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    );
  }

  // login page
  if (showLogin) {
    return (
      <Login
        onLoginSuccess={() => {
          setShowLogin(false);
          setShowDashboard(true);
        }}
        onRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
    );
  }


  // Home Page
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          🤖 AI Interview Portal
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>

          <button
            className="login-btn"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>
        </div>
      </nav>

      <main className="hero" id="home">
        <div className="hero-content">
          <div className="badge">
            ✨ AI-Powered Career Assistant
          </div>

          <h1>
            Prepare Smarter.
            <br />
            <span>Interview Better.</span>
          </h1>

          <p>
            Upload your resume, analyze your skills, discover missing
            skills, and prepare for your next interview with AI.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => setShowLogin(true)}
            >
              Get Started →
            </button>

            <button className="secondary-btn">
              Explore Features
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Resume Analysis</span>
            <span className="status">● Ready</span>
          </div>

          <div className="score-section">
            <div className="score-circle">
              <strong>77.8%</strong>
              <small>Match</small>
            </div>
          </div>

          <div className="skills">
            <div>
              <h4>✓ Matched Skills</h4>

              <div className="skill-list">
                <span>Python</span>
                <span>SQL</span>
                <span>Machine Learning</span>
                <span>Pandas</span>
              </div>
            </div>

            <div>
              <h4>! Missing Skills</h4>

              <div className="skill-list missing">
                <span>Statistics</span>
                <span>Data Visualization</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="features" id="features">
        <h2>Everything You Need to Prepare</h2>

        <p className="section-subtitle">
          One platform to analyze your resume and prepare for interviews.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>

            <h3>Resume Analyzer</h3>

            <p>
              Upload your resume and automatically extract skills,
              education, projects, and experience.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>

            <h3>Job Match Score</h3>

            <p>
              Compare your resume against a target role and discover
              your skill match percentage.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💡</div>

            <h3>Skill Recommendations</h3>

            <p>
              Identify missing skills and get recommendations on what
              to learn next.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <p>
          © 2026 AI Interview Portal. Built with React & Django.
        </p>
      </footer>
    </div>
  );
}

export default App;