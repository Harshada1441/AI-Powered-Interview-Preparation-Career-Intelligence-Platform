import { useState } from "react";
import "./Register.css";

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    college: "",
    branch: "",
    target_role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (typeof data === "object") {
          const messages = Object.values(data)
            .flat()
            .join(" ");

          setError(messages || "Registration failed.");
        } else {
          setError("Registration failed.");
        }

        return;
      }

      alert("Registration successful! Please login.");

      onRegisterSuccess();

    } catch (error) {
      console.error("Registration error:", error);

      setError(
        "Unable to connect to server. Please make sure Django is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-icon">
          🤖
        </div>

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Register to start your AI interview preparation
        </p>

        <form onSubmit={handleRegister}>

          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Phone</label>

            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>College</label>

            <input
              type="text"
              name="college"
              placeholder="Enter college name"
              value={formData.college}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Branch</label>

            <input
              type="text"
              name="branch"
              placeholder="e.g. Computer Engineering"
              value={formData.branch}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Target Role</label>

            <input
              type="text"
              name="target_role"
              placeholder="e.g. Data Scientist"
              value={formData.target_role}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p className="register-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="login-text">
          Already have an account?{" "}
          <span onClick={onBackToLogin}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;