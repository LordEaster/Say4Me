"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Loader2
} from "lucide-react";

const buttonTexts = [
  "ส่งความในใจ 💌",
  "แชร์ความรู้สึก ❤️",
  "ส่งให้คนสำคัญ 💖",
  "บอกสิ่งที่อยากบอก 💬",
  "ส่งข้อความพิเศษ ✨",
];

export function SendMessageDrawer() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ recipient: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buttonText, setButtonText] = useState(buttonTexts[0]); // Default text

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("recipient", formData.recipient);
    form.append("message", formData.message);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setFormData({ recipient: "", message: "" });
      setOpen(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * buttonTexts.length);
      setButtonText(buttonTexts[randomIndex]);
    }, 10000); 

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <motion.div
              key={buttonText}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              animate={{ scale: 1 }}
              className="fixed bottom-4 md:bottom-10 right-4 md:right-10 z-10"
            >
              <Button className="bg-white hover:bg-[#E63946] text-[#FF69B4] hover:text-white rounded-full text-lg font-semibold shadow-lg">
                {buttonText}
              </Button>
          </motion.div>
          </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{buttonText}</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Input
                  placeholder="ฝากบอกใคร (Recipient)"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full"
                />
              </motion.div>

              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Textarea
                  placeholder="อยากบอกอะไร (Message)"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full h-48"
                  maxLength={400}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    color: formData.message.length > 360 ? "#ef4444" : "#6b7280",
                  }}
                  className="text-sm mt-1"
                >
                  {formData.message.length}/400 characters
                </motion.div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full bg-[#FF69B4] hover:bg-[#E63946] text-white" disabled={loading}>
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      "ส่งความในใจ"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
  );
}
