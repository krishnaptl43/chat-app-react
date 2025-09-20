import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            await API.post("/user/register", { username, password });
            alert("Registered successfully");
            navigate("/login");
        } catch (err) {
            alert("Error: " + err.response.data.error);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Register</button>
        </div>
    );
}
