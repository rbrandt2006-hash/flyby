import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export default function AnimatedCard({ children, className, delay = 0, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
      }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-border/40 cursor-pointer transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
