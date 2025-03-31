import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import Registration from './components/Registration/Registration';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/employee-dashboard/:id" element={<EmployeeDashboard />} />
        <Route path="/customer-dashboard/:id" element={<CustomerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
