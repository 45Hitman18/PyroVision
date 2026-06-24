"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

export default function AnimatedItem({ children, className, id }: AnimatedItemProps) {
  return (
    <motion.div
      className={className}
      variants={itemVariants}
      id={id}
    >
      {children}
    </motion.div>
  );
}
