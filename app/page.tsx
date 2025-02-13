"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageList } from "@/components/message-list";
import { SendMessageDrawer } from "@/components/message-dialog";

const messages = [
  "Share your heartfelt messages with someone special",
  "ให้พื้นที่นี้บอกความในใจถึงใครสักคน",
  "Express what words couldn't before",
  "ส่งความรู้สึกผ่านข้อความถึงคนสำคัญ",
  "A few words can change someone's day",
  "ให้ข้อความของคุณสร้างรอยยิ้มให้ใครสักคน"
];

const emojis = ["❤️", "💌", "💖", "💬", "🌸", "💙", "✨", "💭", "📩", "💕"];

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emoji, setEmoji] = useState("❤️");

  useEffect(() => {
    const handleTyping = () => {
      if (!isDeleting) {
        if (charIndex < messages[index].length) {
          setDisplayText((prev) => prev + messages[index][charIndex]);
          setCharIndex((prev) => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 10000);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % messages.length);
        }
      }
    };

    const typingInterval = setTimeout(handleTyping, isDeleting ? 50 : 100);

    return () => clearTimeout(typingInterval);
  }, [charIndex, isDeleting, index]);

  useEffect(() => {
    const changeEmoji = () => {
      setEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    };
    const emojiInterval = setInterval(changeEmoji, 15000);
    return () => clearInterval(emojiInterval);
  }, []);

  useEffect(() => {
    const svgFavicon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `;
    const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgFavicon)}`;

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = svgDataUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [emoji]);

  return (
    <main className="relative h-full w-full mb-32 md:mb-4 overflow-hidden bg-gradient-to-b from-[#ff69b498] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto">
        <div className="text-center mt-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            Say 4 Me{" "}
            <motion.span
              key={emoji}
              className="inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              {emoji}
            </motion.span>
          </h1>
          <motion.p
            key={index}
            className="text-lg text-white dark:text-gray-300 mb-8 h-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {displayText}
          </motion.p>
        </div>
          <MessageList />
          <SendMessageDrawer />
      </div>
    </main>
  );
}
