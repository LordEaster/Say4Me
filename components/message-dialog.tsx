"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Mic, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MessageDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    recipient: string;
    message: string;
    image: File | null;
    voice: File | null;
  }>({
    recipient: "",
    message: "",
    image: null,
    voice: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("recipient", formData.recipient);
      formDataToSend.append("message", formData.message);
      if (formData.image) formDataToSend.append("image", formData.image);
      if (formData.voice) formDataToSend.append("voice", formData.voice);
  
      const response = await fetch("/api/messages", {
        method: "POST",
        body: formDataToSend,
      });
  
      const contentType = response.headers.get("content-type");
      let data;
  
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("Server returned non-JSON response");
      }
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit message");
      }
  
      setFormData({
        recipient: "",
        message: "",
        image: null,
        voice: null
      });
      setOpen(false); 
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="fixed bottom-0 w-full p-4 z-10">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full text-lg font-semibold shadow-lg">
            ✉️ Send Message
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="w-full h-full md:max-w-lg md:h-auto md:mx-auto">
        <DialogHeader>
          <DialogTitle>Send Your Message</DialogTitle>
        </DialogHeader>
        <div className="">
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              placeholder="ฝากบอกใคร (Recipient)"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full"
            />
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Textarea
              placeholder="อยากบอกอะไร (Message)"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full h-32"
              maxLength={100}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                color: formData.message.length > 80 ? "#ef4444" : "#6b7280"
              }}
              className="text-sm mt-1"
            >
              {formData.message.length}/100 characters
            </motion.div>
          </motion.div>

          {/* <motion.div 
            className="flex gap-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Camera className="w-4 h-4" />
                Add Image
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById("voice-upload")?.click()}
              >
                <Mic className="w-4 h-4" />
                Add Voice
              </Button>
            </motion.div>
          </motion.div> */}

          {/* <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData({ ...formData, image: file });
              }
            }}
          />
          <input
            id="voice-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData({ ...formData, voice: file });
              }
            }}
          /> */}

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

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                ) : "ส่งความในใจ"}
              </Button>
            </motion.div>
          </motion.div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}