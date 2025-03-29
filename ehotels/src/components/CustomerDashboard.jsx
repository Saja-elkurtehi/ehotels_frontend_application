import React from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h1>Customer Dashboard</h1>
      <p>Welcome, Valued Customer!</p>
      <button onClick={() => navigate('/')}>Logout</button>
    </div>
  );
};

export default CustomerDashboard;