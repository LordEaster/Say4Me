"use client";

import React, { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MailOpen } from "lucide-react";
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
  };

  return (
    <>
      {/* Search Bar */}
      <div className="p-4 flex justify-center items-center gap-2">
        <Input
          type="text"
          placeholder="ลองค้นหาชื่อของคุณดูสิ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Envelopes Grid */}
      <div className="p-2 flex flex-wrap gap-6 justify-center md:w-3/4 md:mx-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              className="envelope cursor-pointer"
              onClick={() => handleOpenMessage(msg)}
              whileHover={{ y: -3, scale: 1.05 }} 
              transition={{ duration: 0.3 }}
            >
              <div className="paper bg-white rounded-lg items-start relative">
              <p
                className={`absolute top-0 font-semibold text-black text-ellipsis p-2 ${
                  msg.recipient.length > 8 ? "text-xs" : "text-sm"
                }`}
              >
                To: {msg.recipient}
              </p>
              </div>
              <div className="envelope-body flex flex-col items-center justify-center p-2">
                <div className="flex items-center gap-1 text-xs text-white mt-1 scale-90">
                  <MailOpen className="w-3 h-3" />
                  เปิดแล้ว {msg.viewerCount ?? 0} ครั้ง
                </div>
              </div>
              <div className="envelope-flap"></div>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-white">
            ดูเหมือนว่ายังไม่มีข้อความนะ . . .
          </p>
        )}
      </div>

      {/* My Messages Button */}
      {/* <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="fixed bottom-16 md:bottom-24 right-4 md:right-10 z-10">
        <Button className="bg-white hover:bg-[#E63946] text-[#FF69B4] hover:text-white rounded-full text-lg font-semibold shadow-lg" onClick={() => setIsDrawerOpen(true)}>
          <Inbox className="w-6 h-6 mr-2" /> 
          My Messages
        </Button>
      </motion.div> */}

      {/* My Messages Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>My Messages</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            {messages.filter((msg) => msg.sessionId === sessionId).map((msg) => (
              <div key={msg.id} className="p-3 bg-gray-100 rounded-lg">
                <p className="font-semibold">To: {msg.recipient}</p>
                <p>👁️ Opened: {msg.viewerCount} times</p>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog to show full message */}
      {selectedMessage && (
        <Drawer open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DrawerContent className="h-3/4 p-4">
            <DrawerHeader>
              <DrawerTitle>ข้อความนี้ถูกเปิดอ่านแล้ว {selectedMessage.viewerCount} ครั้ง</DrawerTitle>
            </DrawerHeader>
            <div className="text-gray-600  bg-yellow-50 w-full p-4 rounded-lg h-full relative shadow-md memo-bg">
              <p className="p-2 text-2xl font-semibold text-black">
                To: {selectedMessage.recipient}
              </p>
              <p className="text-lg p-4">
                {selectedMessage.message}
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
