"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4"
      >
        <Icon className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-lg font-heading font-bold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={action.onClick}
          className="btn-primary-3d px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
        >
          <span className="text-shadow-sm">{action.label}</span>
        </motion.button>
      )}
    </motion.div>
  );
}
