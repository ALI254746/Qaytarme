"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export default function ErrorRetry({ message, onRetry, className }: ErrorRetryProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ""}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4"
      >
        <AlertCircle className="w-8 h-8 text-destructive" />
      </motion.div>

      <h3 className="text-lg font-bold text-foreground mb-2">
        {message || t("common.error")}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {t("common.error")}
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="btn-primary-3d bg-primary text-primary-foreground rounded-xl px-6 py-3 font-bold text-sm flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        {t("common.retry")}
      </motion.button>
    </motion.div>
  );
}
