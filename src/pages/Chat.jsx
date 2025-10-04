import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet, useParams } from "react-router-dom";
import io from "socket.io-client";
import API from "../api";

export default function ChatList() {

  const socket = io("http://localhost:5000");
  const navigate = useNavigate();
  const { receiverId } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  // Join socket room and listen events
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("join", user._id);

    socket.on("privateMessage", (msg) => {
      if (msg.sender === receiverId || msg.receiver === user?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("privateMessage");
  }, [receiverId, user?._id]);

  // Load all users except me
  useEffect(() => {
    API.get("/user").then((res) =>
      setUsers(res.data.filter((u) => u._id !== user._id))
    );
  }, []);

  const loadMessages = async (receiverId) => {
    navigate(`/chat/${receiverId}`, { state: users })
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
              className={`p-3 cursor-pointer hover:bg-gray-300 flex justify-between items-center ${receiverId === u._id ? "bg-gray-300 font-semibold" : ""
                }`}
            >
              <span>{u.username}</span>
              <span className="w-3 h-3 bg-green-500 rounded-full">
                {messages.filter(item => item.sender === u._id)?.length}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-3/4 text-gray-500">
        <Outlet context={{ socket }} />
      </div>
    </div>
  );
}
