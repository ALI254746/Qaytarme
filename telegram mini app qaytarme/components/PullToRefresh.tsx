"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export default function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || container.scrollTop > 0) {
        setIsPulling(false);
        return;
      }
      
      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const rotation = (pullDistance / threshold) * 360;
  const shouldRelease = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative overflow-auto">
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
            style={{ height: `${Math.min(pullDistance, threshold * 1.5)}px` }}
          >
            <motion.div
              animate={{ 
                rotate: isRefreshing ? 360 : rotation,
                scale: shouldRelease ? 1.1 : 1
              }}
              transition={{ 
                rotate: { repeat: isRefreshing ? Infinity : 0, duration: 1, ease: "linear" }
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                shouldRelease 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "bg-card border border-border"
              }`}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ y: isPulling ? pullDistance : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
