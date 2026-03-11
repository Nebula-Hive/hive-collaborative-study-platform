import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FaArrowLeft } from "react-icons/fa";
const SERVER_URL = "http://localhost:3002";
import { IoSend } from "react-icons/io5";

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [batch, setBatch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on("receiveMessage", (data) => {
      if (data.system === undefined) data.system = false;
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("pastMessages", (pastMsgs) => {
      setMessages(
        pastMsgs.map((m) => ({
          ...m,
          system: m.username === "System",
        }))
      );
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const getBatchFromId = (id) => id.split("/")[1]?.toUpperCase() || "";

  const joinRoom = () => {
    const trimmed = studentId.trim();
    if (!trimmed) return;
    const detectedBatch = getBatchFromId(trimmed);
    setBatch(detectedBatch);
    socket.emit("joinGroup", { room: detectedBatch, username: trimmed });
    setJoined(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    socket.emit("sendMessage", { room: batch, username: studentId, message });
    setMessage("");
  };

  const leaveRoom = () => {
    if (socket) socket.emit("leaveGroup");
    setJoined(false);
    setBatch("");
    setStudentId("");
    setMessages([]);
  };

  return (
<div className="relative min-h-screen bg-primary font-sans">
      {/* Fixed Header */}
<header className="sticky top-17 bg-primary-200  backdrop-blur-sm border-b border-amber-100 z-50">
<div className="w-full mx-auto flex items-center justify-between px-6 py-2">
    
    <div className="flex items-center gap-4">
      <button className="text-2xl text-gray-700">
        <FaArrowLeft />
      </button>

      {joined ? (
        <div className="text-gray-800 font-semibold">
          Batch: {batch || "N/A"} | Student: {studentId || "N/A"}
        </div>
      ) : (
        <h1 className="text-lg font-semibold text-gray-800">
          Student Chat
        </h1>
      )}
    </div>

    {joined && (
      <button
        onClick={leaveRoom}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        Leave
      </button>
    )}

  </div>
</header>

      {/* Join Form */}
      {!joined ? (
        <div className="flex items-center justify-center h-screen pt-20">
          <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-amber-50 shadow-xl">
            <h2 className="text-xl font-medium text-center mb-6 text-gray-800">
              Join Your Batch Chat
            </h2>
            <input
              type="text"
              placeholder="Enter Student ID (e.g. SE/2022/013)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-5 py-4 mb-5 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-400 transition"
            />
            <button
              onClick={joinRoom}
              className="w-full py-4 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 transition"
            >
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen pt-16">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20 italic">
                No messages yet. Say something!
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.system
                      ? "justify-center"
                      : msg.username === studentId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {msg.system ? (
                    <div className="px-6 py-2.5 bg-amber-50/70 text-gray-600 text-sm rounded-full">
                      {msg.message}
                    </div>
                  ) : (
<div
  className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm wrap-break-word whitespace-pre-wrap ${
    msg.username === studentId
      ? "bg-amber-600 text-white rounded-br-none"
      : "bg-white text-gray-900 rounded-bl-none border border-amber-100"
  }`}
>
                      <div className="font-medium text-sm opacity-90 mb-1">
                        {msg.username === studentId ? "You" : msg.username}
                      </div>
                      {msg.message}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input */}
          <form
            className="sticky bottom-0 mx-4 mb-4 bg-white/80 backdrop-blur-lg border border-amber-100 rounded-full shadow-lg overflow-hidden flex items-center pr-2 pl-5   py-1.5"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-base"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className=" bg-gray-800 text-white p-3 rounded-full hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}