import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css'; // Ensure this is the correct path for your CSS file

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/signup/`, {
        username,
        password,
      });
      // After successful signup, display alert and redirect to login page
      alert('Signup successful! Please log in.');
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <img src="/images/background/12.jpg" alt="background" className="signup-image" />
      </div>
      <div className="signup-right">
        <div className="signup-form">
          <h2>Create a Free Account</h2>
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

            <button type="submit" className="signup-button">Register</button>

            {error && <p className="error-message">{error}</p>}

            <div className="login-link">
              Already have an account? <a href="/login">Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;


  
