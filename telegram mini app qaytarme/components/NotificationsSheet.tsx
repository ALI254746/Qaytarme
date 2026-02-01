"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Package, CheckCheck, Clock } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    type: "match" | "system" | "update";
    read: boolean;
    image?: string;
}

const mockNotifications: Notification[] = [
    {
        id: 1,
        title: "New Match Found!",
        message: "A 'Silver Macbook' matching your lost item report was found near Library.",
        time: "2m ago",
        type: "match",
        read: false,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=100"
    },
    {
        id: 2,
        title: "Item Returned",
        message: "You successfully returned 'Vintage Keys'. +50 Karma points!",
        time: "1h ago",
        type: "system",
        read: true
    },
    {
        id: 3,
        title: "Weekly Summary",
        message: "3 new items were reported in your area today.",
        time: "5h ago",
        type: "update",
        read: true
    }
];

interface NotificationsSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationsSheet({ isOpen, onClose }: NotificationsSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
        {isOpen && (
            <>
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
                />
                
                {/* Sheet */}
                <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed left-0 right-0 z-[10000] bg-background rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col border-t border-white/40"
                    style={{
                        top: "40vh",
                        height: "60vh",
                        maxHeight: "60vh",
                        willChange: "transform"
                    }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) {
                            onClose();
                        }
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-2 border-b border-border/40 shrink-0 bg-background/80 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Bell className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-heading font-bold">Notifications</h2>
                            <span className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 New</span>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 no-scrollbar overscroll-y-contain">
                        {mockNotifications.map((notif) => (
                            <div key={notif.id} className={`relative p-4 rounded-[24px] border ${notif.read ? 'bg-card/40 border-border/30' : 'bg-card border-primary/20 shadow-sm'} transition-all active:scale-[0.98]`}>
                                {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-destructive rounded-full"></div>}
                                
                                <div className="flex gap-4">
                                    <div className="shrink-0 pt-1">
                                        {notif.type === 'match' && notif.image ? (
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden relative shadow-sm border border-border">
                                                <Image src={notif.image} alt="Item" fill className="object-cover" />
                                            </div>
                                        ): (
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${notif.type === 'system' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {notif.type === 'system' ? <Package className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-bold ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>{notif.title}</h3>
                                            <span className="text-[10px] text-muted-foreground font-medium">{notif.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                                        
                                        {notif.type === 'match' && (
                                            <button className="mt-3 w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform">
                                                View Match
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                         <div className="text-center py-6 text-muted-foreground text-xs font-medium opacity-50">
                            No older notifications
                        </div>
                    </div>
                    
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />
                </motion.div>
            </>
        )}
    </AnimatePresence>,
    document.body
  );
}
