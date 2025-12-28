import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
interface AlertCardProps {
  message: string;
  trip: string;
  delay?: number;
}
export default function AlertCard({
  message,
  trip,
  delay = 0
}: AlertCardProps) {
  return <motion.div initial={{
    opacity: 0,
    x: -20
  }} animate={{
    opacity: 1,
    x: 0
  }} transition={{
    duration: 0.5,
    delay,
    ease: [0.25, 0.1, 0.25, 1]
  }} className="relative overflow-hidden rounded-xl border border-warning/30 bg-warning/5">
      {/* Subtle pulse glow */}
      <motion.div className="absolute inset-0 bg-warning/10" animate={{
      opacity: [0.3, 0.6, 0.3]
    }} transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }} />
      
      <div className="relative flex items-center gap-4 p-4 bg-[#d4dff2]">
        <motion.div animate={{
        scale: [1, 1.1, 1]
      }} transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#a3c5e0]">
          <AlertTriangle className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">{trip}</p>
        </div>
        <Button variant="outline" size="sm">
          View alternatives
        </Button>
      </div>
    </motion.div>;
}