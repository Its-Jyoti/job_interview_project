import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Ensure this is the correct path for your CSS file

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/login/`, {
        username,
        password,
      });
      // After successful login, redirect to the form page
      console.log("Login successful, redirecting to form...");
      navigate('/form');
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password'); // Navigate to the forgot password page
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src="/images/background/12.jpg" alt="background" className="login-image" />
      </div>
      <div className="login-right">
        <div className="login-form">
          <h2>Login to Your Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-password-link">
              <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>

            <button type="submit" className="login-button">Login</button>

            {error && <p className="error-message">{error}</p>}

            <div className="signup-link">
              Don't have an account? <a href="/signup">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
