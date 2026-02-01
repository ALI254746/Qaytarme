"use client";

import {
  ChevronLeft,
  MoreVertical,
  Info,
  Plus,
  Smile,
  Send,
  Check,
  ArrowRight,
  Clock,
  X,
  User,
  Settings,
  LogOut,
  Shield,
  Bell,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { useUIContext } from "@/context/UIContext";
import { ChatPageSkeleton } from "@/components/SkeletonLoader";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  time: string;
  isTyping?: boolean;
}

interface Account {
  id: number;
  name: string;
  username: string;
  avatar: string;
  isActive: boolean;
}

const accounts: Account[] = [
  {
    id: 1,
    name: "Aziz Al-Rahman",
    username: "@aziz_dev",
    avatar: "https://i.pravatar.cc/150?u=aziz_profile",
    isActive: true,
  },
  {
    id: 2,
    name: "Sarah Chen",
    username: "@sarah_chen",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    isActive: false,
  },
  {
    id: 3,
    name: "John Doe",
    username: "@john_doe",
    avatar: "https://i.pravatar.cc/150?u=john",
    isActive: false,
  },
];

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountMenuMounted, setAccountMenuMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setNavVisible } = useUIContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I found your MacBook. Is it still available?",
      sender: "other",
      time: "10:30 AM",
    },
    {
      id: 2,
      text: "Hello! I found your MacBook.",
      sender: "me",
      time: "10:32 AM",
    },
    {
      id: 3,
      text: "Yes, it is! Where did you find it?",
      sender: "other",
      time: "10:33 AM",
    },
    {
      id: 4,
      text: "Near the library entrance. I can meet you there.",
      sender: "me",
      time: "10:35 AM",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const _matchId = searchParams.get("id");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setAccountMenuMounted(true);
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAccountMenuOpen) {
      document.body.style.overflow = "hidden";
      setNavVisible(false);
    } else {
      document.body.style.overflow = "";
      setNavVisible(true);
    }
    return () => {
      document.body.style.overflow = "";
      setNavVisible(true);
    };
  }, [isAccountMenuOpen, setNavVisible]);

  if (isLoading) {
    return <ChatPageSkeleton />;
  }

  const handleHandover = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Also a big burst from center
    confetti({
      origin: { y: 0.7 },
      spread: 100,
      particleCount: 150,
      scalar: 1.2,
      colors: ["#A9D3C9", "#E05D5D", "#F7F6E2"],
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: message.trim(),
        sender: "me",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate typing response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const response: Message = {
          id: messages.length + 2,
          text: "Thank you! I'll be there in 10 minutes.",
          sender: "other",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        };
        setMessages((prev) => [...prev, response]);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-32">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply"></div>
      <div className="fixed top-[20%] left-[-50px] w-[300px] h-[300px] bg-secondary/60 rounded-full blur-[60px] pointer-events-none mix-blend-multiply"></div>

      {/* Header Section */}
      <header className="relative z-10 pt-6 px-6 flex items-center gap-4">
        <Link href="/matches">
          <button className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-sm">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>

        <div className="flex-1 flex flex-col">
          <h1 className="text-xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2">
            Sarah Chen
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </h1>
          <span className="text-muted-foreground text-xs font-medium">
            Active now
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAccountMenuOpen(true)}
          className="btn-3d w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-foreground hover:bg-card/20 transition-colors"
        >
          <MoreVertical className="w-6 h-6" />
        </motion.button>
      </header>

      {/* Context Strip (Sticky/Top) */}
      <div className="sticky top-2 z-20 px-6 mt-6">
        <div className="bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] p-4 shadow-lg shadow-black/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 relative">
            <Image
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=200"
              alt="Item"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/5"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="font-bold text-foreground text-sm truncate pr-2">
                MacBook Pro 14&quot;
              </h3>
              <span className="bg-primary/20 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                Negotiating
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-medium truncate">
              Found at Central Library
            </p>
          </div>
          <button className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="relative z-10 px-6 mt-6 flex flex-col gap-4 pb-32">
        {/* Date Separator */}
        <div className="flex justify-center my-2">
          <span className="bg-muted/50 text-muted-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-end gap-2.5 max-w-[85%] ${
                msg.sender === "me" ? "self-end ml-auto" : "self-start"
              }`}
            >
              {msg.sender === "other" && (
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm relative">
                  <Image
                    src="https://i.pravatar.cc/150?u=sarah"
                    alt="Sarah"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card/80 backdrop-blur-sm border border-border/50 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                </div>
                <div
                  className={`text-[10px] text-muted-foreground/70 font-medium px-1 ${
                    msg.sender === "me" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.time}
                </div>
              </div>
              {msg.sender === "me" && (
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm relative">
                  <Image
                    src="https://i.pravatar.cc/150?u=me"
                    alt="Me"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-end gap-2.5 max-w-[85%] self-start"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm relative">
                <Image
                  src="https://i.pravatar.cc/150?u=sarah"
                  alt="Sarah"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Action & Input Area (Fixed above Tab Bar) */}
      <div className="fixed bottom-[112px] left-6 right-6 z-40 flex flex-col gap-4 pointer-events-none">
        {/* Pointer events auto on children to allow clicks but pass through container */}

        {/* Confirm Handover Button */}
        <button
          onClick={handleHandover}
          className="btn-primary-3d w-full pointer-events-auto bg-primary-foreground h-14 rounded-[20px] flex items-center justify-between px-6 group overflow-hidden relative"
        >
          {/* Shine effect */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Check className="w-[18px] text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-sm text-shadow-md">
              Confirm Handover
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Input Field */}
        <div className="flex gap-3 pointer-events-auto">
          <div className="flex-1 h-[60px] bg-card/90 backdrop-blur-xl border border-white/20 rounded-[30px] shadow-lg shadow-black/5 flex items-center px-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
              <Plus className="w-6 h-6" />
            </button>
            <input
              type="text"
              placeholder="Message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none outline-none h-full px-2 text-foreground placeholder:text-muted-foreground/60 font-medium"
            />
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
              <Smile className="w-6 h-6" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95, y: 0 }}
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="btn-primary-3d w-[60px] h-[60px] bg-primary rounded-[30px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:y-0"
          >
            <Send className="w-6 h-6 text-primary-foreground ml-1" />
          </motion.button>
        </div>
      </div>

      {/* Account Menu Sheet */}
      {accountMenuMounted && createPortal(
        <AnimatePresence>
          {isAccountMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAccountMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 right-0 bg-background z-[70] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col border-t border-white/40"
                style={{
                  top: "20vh",
                  height: "80vh",
                  maxHeight: "80vh",
                  willChange: "transform",
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.y > 100 || velocity.y > 500) {
                    setIsAccountMenuOpen(false);
                  }
                }}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />

                {/* Close Button */}
                <button
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar overscroll-y-contain pb-20">
                  <div className="p-6 pt-10 space-y-6">
                    {/* Header */}
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-2 text-shadow-sm">
                        Switch Account
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Choose an account to continue
                      </p>
                    </div>

                    {/* Accounts List */}
                    <div className="space-y-2">
                      {accounts.map((account, index) => (
                        <motion.button
                          key={account.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Handle account switch
                            setIsAccountMenuOpen(false);
                          }}
                          className={`card-3d w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                            account.isActive
                              ? "bg-primary/10 border-2 border-primary/30"
                              : "bg-card border border-border/50 hover:bg-card/80"
                          }`}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-sm relative">
                              <Image
                                src={account.avatar}
                                alt={account.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {account.isActive && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-bold text-foreground text-sm text-shadow-sm">
                              {account.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {account.username}
                            </p>
                          </div>
                          {account.isActive && (
                            <div className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
                              Active
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Add Account Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-3d w-full p-4 rounded-xl flex items-center gap-3 bg-card border border-border/50 hover:bg-card/80"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-foreground text-sm text-shadow-sm">
                          Add Account
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Sign in with another account
                        </p>
                      </div>
                    </motion.button>

                    {/* Menu Items */}
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full p-4 rounded-xl flex items-center gap-3 bg-card border border-border/50 hover:bg-card/80 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-bold text-foreground text-sm text-shadow-sm">
                          Profile Settings
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full p-4 rounded-xl flex items-center gap-3 bg-card border border-border/50 hover:bg-card/80 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-bold text-foreground text-sm text-shadow-sm">
                          Chat Settings
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full p-4 rounded-xl flex items-center gap-3 bg-card border border-border/50 hover:bg-card/80 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="font-bold text-foreground text-sm text-shadow-sm">
                          Notifications
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full p-4 rounded-xl flex items-center gap-3 bg-card border border-border/50 hover:bg-card/80 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-bold text-foreground text-sm text-shadow-sm">
                          Privacy & Security
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full p-4 rounded-xl flex items-center gap-3 bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-destructive" />
                        </div>
                        <span className="font-bold text-destructive text-sm text-shadow-sm">
                          Log Out
                        </span>
                        <ArrowRight className="w-4 h-4 text-destructive/60 ml-auto" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
