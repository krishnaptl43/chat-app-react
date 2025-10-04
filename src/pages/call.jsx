import { useEffect, useState } from "react";
import useWebRTC from "../hooks/useWebRTC";
import { useLocation, useOutletContext, useParams } from "react-router-dom";
import API from "../api";

export default function ChatRoom() {
    const { socket } = useOutletContext()
    const users = useLocation().state

    const user = JSON.parse(localStorage.getItem("user"));
    // existing chat code ...
    const { receiverId } = useParams(); // logged-in user id
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Join socket room and listen events
    useEffect(() => {
        if (!user?._id) return;

        socket?.emit("onlineUsers", { receiver: receiverId });

        socket?.on("privateMessage", (msg) => {
            if (msg.sender === receiverId || msg.receiver === receiverId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        socket?.on("onlineUsers", (users) => setOnlineUsers(users));

        return () => socket?.off("privateMessage");
    }, [receiverId, user?._id]);


    const sendMessage = () => {
        if (!text.trim() || !receiverId) return;
        socket?.emit("privateMessage", {
            sender: user._id,
            receiver: receiverId,
            text,
        });
        setText("");
    };

    const {
        localStream,
        remoteStream,
        incomingCall,
        callUser,
        acceptCall,
        rejectCall,
        hangup,
    } = useWebRTC(user._id);

    useEffect(() => {
        (async () => {
            try {
                const res = await API.get(`/messages/${user._id}/${receiverId}`);
                setMessages(res.data);
            } catch (error) {
                console.log(error);
            }
        })()
    }, [receiverId, user._id])

    return (
        <>
            <div className="flex flex-col h-screen">
                {receiverId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 flex justify-between bg-white border-b font-semibold">
                            <h2>
                                Chat with {users?.find((u) => u._id === receiverId)?.username}
                                <span className="text-gray-500">{onlineUsers?.userId && "online"}</span>
                            </h2>
                            <div className="space-x-2">
                                <button
                                    onClick={() => callUser(receiverId, "audio", user)}
                                    className="px-2 py-1 bg-green-500 text-white rounded"
                                >
                                    📞
                                </button>
                                <button
                                    onClick={() => callUser(receiverId, "video", user)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded"
                                >
                                    📹
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`flex ${m.sender === user._id ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg ${m.sender === user._id
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

            {/* Incoming call popup */}
            {incomingCall && (
                <div className="fixed bottom-5 right-5 bg-white p-4 rounded shadow-lg">
                    <p>{incomingCall.fromUser.username} is calling…</p>
                    <button
                        onClick={acceptCall}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Accept
                    </button>
                    <button
                        onClick={rejectCall}
                        className="bg-red-500 text-white px-4 py-2 rounded ml-2"
                    >
                        Reject
                    </button>
                </div>
            )}

            {/* Media display */}
            {remoteStream && (
                <div className="fixed bottom-4 right-4 z-40 bg-white rounded shadow p-2">
                    {/*  Render local video */}
                    <video
                        autoPlay
                        muted
                        playsInline
                        ref={(v) => v && localStream.current && (v.srcObject = localStream.current)}
                    />
                    {/*  Render remote video */}
                    {remoteStream && (
                        <video
                            autoPlay
                            playsInline
                            ref={(v) => v && (v.srcObject = remoteStream)}
                        />
                    )}
                    <button
                        onClick={hangup}
                        className="bg-red-500 text-white w-full mt-2 py-1 rounded"
                    >
                        Hang Up
                    </button>
                </div>
            )}

        </>
    );
}
