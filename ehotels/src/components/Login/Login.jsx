import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (username === 'employee' && password === 'employee') {
      navigate('/employee-dashboard');
    } else if (username === 'customer' && password === 'customer') {
      navigate('/customer-dashboard');
    } else {
      alert('Invalid credentials! Use "employee" or "customer" for both fields');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header">
          <h1>Welcome Back</h1>
          <p>Please login to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              autoComplete="off" 
            />
            <label htmlFor="username">Username</label>
            <i className="fas fa-user"></i>
          </div>

          <div className="input-group">
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              autoComplete="off" 
            />
            <label htmlFor="password">Password</label>
            <i className="fas fa-lock"></i>
          </div>

          <button type="submit" className="login-btn">
            Sign In <i className="fas fa-arrow-right"></i>
          </button>
        </form>
        <p className="signup-link">Don't have an account? <a href="/signup">Create account</a></p>
      </div>
    </div>
  );
};

export default Login;