"use client";

import React, { useEffect, useState } from "react";
import { MailOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import "./styles.css"; // Ensure envelope styles are present

interface Message {
  id: string;
  recipient: string;
  message: string;
  sessionId?: string;
  viewerCount?: number;
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem("sessionId", storedSessionId);
    }
    setSessionId(storedSessionId);

    fetchAllMessages();

    const eventSource = new EventSource("/api/subscribe");
    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    eventSource.onerror = () => eventSource.close();
    return () => {
      eventSource.close();
    };
  }, []);

  const fetchAllMessages = async () => {
    try {
      const response = await fetch(`/api/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
      setFilteredMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Search Filter
  useEffect(() => {
    const filtered = messages.filter((msg) =>
      msg.recipient.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMessages(filtered);
  }, [searchQuery, messages]);

  const handleOpenMessage = async (msg: Message) => {
    setSelectedMessage(msg);

    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id }),
    });

    setMessages((prevMessages) =>
      prevMessages.map((m) => (m.id === msg.id ? { ...m, viewerCount: (m.viewerCount || 0) + 1 } : m))
    );
  };

  return (
    <>
      {/* Background Decorations */}
      <div className="background">
        {/* Floating Clouds */}
        <motion.div className="cloud cloud-1" animate={{ x: [0, 20, 0] }} transition={{ duration: 15, repeat: Infinity }} />
        <motion.div className="cloud cloud-2" animate={{ x: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity }} />
        <motion.div className="cloud cloud-3" animate={{ x: [0, 25, 0] }} transition={{ duration: 18, repeat: Infinity }} />

        {/* Floating Hearts */}
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            className="heart"
            initial={{ y: "100vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: 1 }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity }}
            style={{ left: `${Math.random() * 90}%` }}
          />
        ))}
      </div>

      {/* Search Bar */}
      <div className="p-4 flex justify-center items-center gap-2">
        <Input
          type="text"
          placeholder="ลองค้นหาชื่อของคุณดูสิ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg"
        />
        <Button variant="outline">
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Envelopes Grid */}
      <div className="p-2 flex flex-wrap gap-6 justify-center md:w-3/4 md:mx-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              className="envelope cursor-pointer"
              onClick={() => handleOpenMessage(msg)}
              whileHover={{ y: -5, scale: 1.05 }} 
              transition={{ duration: 0.3 }}
            >
              <div className="paper bg-white rounded-lg items-start relative">
                <p className="absolute top-0 font-semibold text-sm text-black text-ellipsis p-2">To: {msg.recipient}</p>
              </div>
              <div className="envelope-body flex flex-col items-center justify-center p-2">
                <div className="flex items-center gap-1 text-xs text-white mt-1">
                  <MailOpen className="w-3 h-3" />
                  {msg.viewerCount ?? 0} views
                </div>
              </div>
              <div className="envelope-flap"></div>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-white">ดูเหมือนว่าไม่มีข้อความที่คุณกำลังค้นหา</p>
        )}
      </div>
    </>
  );
}
