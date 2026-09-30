import React from "react";
import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";

export function PremiumLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-4 border-muted border-t-primary rounded-full absolute -top-4 -left-4"
        />
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-soft-lg">
          <ChefHat size={32} />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-bold tracking-tight text-foreground">TheKitchenHub</h2>
        <p className="text-sm text-muted-foreground mt-1">Preparing your kitchen...</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Designed and Developed by <span className="font-semibold text-primary">Anand Pinisetty</span>
        </p>
      </motion.div>
    </div>
  );
}
