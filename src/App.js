import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CitizenDashboard from "./pages/CitizenDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import HigherOfficialDashboard from "./pages/HigherOfficialDashboard";
import IssueDetails from "./pages/IssueDetails";
import "./index.css";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Login</Link>
        <Link to="/signup">Signup</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/citizen" element={<CitizenDashboard />} />
        <Route path="/official" element={<OfficialDashboard />} />
        <Route path="/higher-official" element={<HigherOfficialDashboard />} />
        <Route path="/issue/:id" element={<IssueDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
