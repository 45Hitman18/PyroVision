"use client";

import { motion } from "framer-motion";

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  className?: string;
}

export default function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const configs = {
    low: {
      colorClass: "bg-risk-low",
      bgClass: "bg-risk-low/10",
      textClass: "text-risk-low",
      borderClass: "border-risk-low/20",
      label: "Low Risk",
    },
    medium: {
      colorClass: "bg-risk-medium",
      bgClass: "bg-risk-medium/10",
      textClass: "text-risk-medium",
      borderClass: "border-risk-medium/20",
      label: "Medium Risk",
    },
    high: {
      colorClass: "bg-risk-high",
      bgClass: "bg-risk-high/10",
      textClass: "text-risk-high",
      borderClass: "border-risk-high/20",
      label: "High Risk",
    },
  };

  const config = configs[level];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} text-[10px] font-bold uppercase tracking-wider ${className}`}>
      <motion.div
        className={`w-2 h-2 rounded-full ${config.colorClass}`}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      {config.label}
    </div>
  );
}
