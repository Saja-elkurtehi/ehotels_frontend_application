import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h1>Employee Dashboard</h1>
      <p>Welcome, Team Member!</p>
      <button onClick={() => navigate('/')}>Logout</button>
    </div>
  );
};

export default EmployeeDashboard;