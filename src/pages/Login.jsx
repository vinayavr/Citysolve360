import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("citizen");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === "citizen") navigate("/citizen");
    else if (role === "official") navigate("/official");
    else navigate("/higher-official");
  };

  return (
    <div className="page-container">
      <h2>Citysolve360 Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="citizen">Citizen</option>
          <option value="official">Official</option>
          <option value="higher-official">Higher Official</option>
        </select>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
