"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

export default function Button({ 
  variant = "primary", 
  children, 
  className = "", 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full px-6 py-3 font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-fire-orange to-fire-amber text-white hover:scale-105 transition-transform",
    secondary: "bg-white border border-zinc-200 shadow-[var(--card-shadow)] text-zinc-900",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
