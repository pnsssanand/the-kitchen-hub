"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isArtificialLoading, setIsArtificialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsArtificialLoading(false);
    }, 4000); // 4 seconds loading animation
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || isArtificialLoading) {
    return <PremiumLoader />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-64 h-full bg-card shadow-2xl flex flex-col"
            >
              <button 
                className="absolute top-4 right-4 p-2 bg-muted rounded-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
              <div className="h-full overflow-hidden">
                <Sidebar />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-full flex flex-col p-4 sm:p-6 md:p-8"
            >
              <div className="max-w-7xl mx-auto w-full flex-1">
                {children}
              </div>
              
              <footer className="mt-12 py-6 text-center border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Designed and Developed by <span className="font-semibold text-primary">Anand Pinisetty</span>
                </p>
              </footer>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
