"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import "./styles.css"; // Import the envelope styles

interface Message {
  id: string;
  recipient: string;
  message: string;
  image?: string;
  voice?: string;
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [messageSettings, setMessageSettings] = useState<Record<string, { speed: number; top: number }>>({});
  const [maxMessagesOnScreen, setMaxMessagesOnScreen] = useState(3); // Default for mobile
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const messageHeight = 15; // Spacing to prevent collisions

  // Detect screen size and adjust message limit
  useEffect(() => {
    const updateMessageLimit = () => {
      if (window.innerWidth >= 1024) {
        setMaxMessagesOnScreen(5); // Desktop: Show 5 messages
      } else {
        setMaxMessagesOnScreen(3); // Mobile: Show 3 messages
      }
    };

    updateMessageLimit();
    window.addEventListener("resize", updateMessageLimit);
    return () => window.removeEventListener("resize", updateMessageLimit);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        setMessages(data);

        setMessageSettings((prevSettings) => {
          const newSettings = { ...prevSettings };
          const usedPositions: number[] = [];

          data.forEach((msg: Message) => {
            if (!newSettings[msg.id]) {
              let uniqueTop = generateUniqueTop(usedPositions);
              usedPositions.push(uniqueTop);
              newSettings[msg.id] = {
                speed: Math.random() * 10 + 30,
                top: uniqueTop,
              };
            }
          });

          return newSettings;
        });

        setActiveMessages(data.slice(0, maxMessagesOnScreen));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const eventSource = new EventSource("/api/messages/subscribe");

    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        setMessages((prevMessages) => {
          const updatedMessages = [newMessage, ...prevMessages];

          if (activeMessages.length < maxMessagesOnScreen) {
            setActiveMessages((prevActive) => [...prevActive, newMessage]);
          }

          return updatedMessages;
        });

        setMessageSettings((prevSettings) => {
          const usedPositions = Object.values(prevSettings).map((s) => s.top);
          return {
            ...prevSettings,
            [newMessage.id]: {
              speed: Math.random() * 10 + 30,
              top: generateUniqueTop(usedPositions),
            },
          };
        });
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [maxMessagesOnScreen]);

  // Rotate messages every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessages((prevActive) => {
        if (messages.length === 0) return prevActive;

        const remainingMessages = messages.filter((msg) => !prevActive.includes(msg));
        if (remainingMessages.length === 0) return prevActive;

        return [...prevActive.slice(1), remainingMessages[0]];
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [messages, maxMessagesOnScreen]);

  const generateUniqueTop = (existingPositions: number[]) => {
    const minTop = 20;
    const maxTop = 70;
    let top: number;
    let attempts = 0;

    do {
      top = Math.floor(Math.random() * (maxTop - minTop) + minTop);
      let isTooClose = existingPositions.some((pos) => Math.abs(pos - top) < messageHeight);
      if (!isTooClose || attempts > 50) break;
      attempts++;
    } while (true);

    return top;
  };

  if (!messages.length) {
    return <p className="h-screen text-center mx-auto my-auto mt-48 text-gray-500 dark:text-gray-400">Send your first message!</p>;
  }

  return (
    <>
      <div className="overflow-hidden relative h-screen">
        {activeMessages.map((msg, index) => {
          const settings = messageSettings[msg.id] || { speed: 50, top: 50 };

          return (
            <motion.div
              key={msg.id}
              className="envelope"
              style={{ top: `${settings.top}%` }}
              initial={{ x: "100vw", opacity: 1 }}
              animate={{ x: "-120vw" }}
              transition={{
                duration: settings.speed,
                ease: "linear",
                onComplete: () => {
                  setActiveMessages((prevActive) =>
                    prevActive.filter((activeMsg) => activeMsg.id !== msg.id)
                  );

                  setMessages((prevMessages) => {
                    const remainingMessages = prevMessages.filter((m) => m.id !== msg.id);
                    if (remainingMessages.length > 0) {
                      return [...remainingMessages, prevMessages.find((m) => m.id === msg.id)!];
                    }
                    return remainingMessages;
                  });
                },
              }}
              onClick={() => setSelectedMessage(msg)}
            >
              <div className="envelope-flap"></div>
              <div className="envelope-body top-3">to: {msg.recipient}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog to show message details */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="h-3/4 md:max-w-lg md:h-auto md:mx-auto">
            <DialogHeader>
              <DialogTitle>Message to {selectedMessage.recipient}</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">{selectedMessage.message}</p>
            {selectedMessage.image && (
              <div className="mt-2">
                <img src={selectedMessage.image} alt="Attachment" className="rounded-lg w-full object-cover" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
