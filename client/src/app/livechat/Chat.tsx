"use client";
import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";
import { MessageSquare, Send, X } from "lucide-react";

// Define the Message interface
interface Message {
  id: string;
  text: string;
  timestamp: Timestamp;
  userId?: string;
}

const Chat = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = "user123"; // 🔹 Replace with actual authenticated user ID

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        timestamp: Timestamp.now(),
        userId: currentUserId, // 🔹 Set the sender ID
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-yellow-500 text-white p-4 rounded-full shadow-lg hover:bg-yellow-600 transition"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-16 right-6 bg-white shadow-lg w-80 rounded-lg border z-50">
          {/* Chat Header */}
          <div className="flex justify-between items-center p-3 bg-yellow-300 border-b">
            <h3 className="font-semibold text-white">Live Chat</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="h-64 overflow-y-auto p-4">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 my-2 rounded-lg shadow-sm w-fit max-w-[75%] ${
                    msg.userId === currentUserId
                      ? "ml-auto bg-yellow-300 text-right" // Sent Message (Right)
                      : "mr-auto bg-gray-200 text-left" // Received Message (Left)
                  }`}
                >
                  {msg.text}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No messages yet.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
