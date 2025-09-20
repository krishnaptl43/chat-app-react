import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import API from "../api";

const socket = io("http://localhost:5000");

export default function Chat() {
  const { id } = useParams(); // logged-in user id
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Join socket room and listen events
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("join", user._id);

    socket.on("privateMessage", (msg) => {
      if (msg.sender === receiver || msg.receiver === receiver) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("onlineUsers", (users) => setOnlineUsers(users));

    return () => socket.off("privateMessage");
  }, [receiver, user?._id]);

  // Load all users except me
  useEffect(() => {
    API.get("/user").then((res) =>
      setUsers(res.data.filter((u) => u._id !== user._id))
    );
  }, []);

  const loadMessages = async (receiverId) => {
    setReceiver(receiverId);
    const res = await API.get(`/messages/${user._id}/${receiverId}`);
    setMessages(res.data);
  };

  const sendMessage = () => {
    if (!text.trim() || !receiver) return;
    socket.emit("privateMessage", {
      sender: user._id,
      receiver,
      text,
    });
    setText("");
  };

  const handleLogout = () => {
    socket.disconnect(); // disconnect socket
    localStorage.removeItem("user"); // clear user
    navigate("/login"); // go to login
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="p-4 font-bold text-lg border-b flex justify-between items-center">
          <span>{user?.username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 border border-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => loadMessages(u._id)}
              className={`p-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                receiver === u._id ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              <span>{u.username}</span>
              {onlineUsers.includes(u._id) && (
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {receiver ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b font-semibold">
              Chat with {users.find((u) => u._id === receiver)?.username}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.sender === user._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      m.sender === user._id
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-300 text-black rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t flex space-x-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
