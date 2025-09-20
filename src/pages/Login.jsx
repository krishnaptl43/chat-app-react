import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await API.post("/user/login", { username, password });
            localStorage.setItem("user", JSON.stringify(res.data));
            navigate("/chat/" + res.data._id);
        } catch (err) {
            alert("Invalid credentials");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}
