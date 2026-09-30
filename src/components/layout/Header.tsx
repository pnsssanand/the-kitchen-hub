"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Menu } from "lucide-react";
import { format } from "date-fns";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/schedule": "Cooking Schedule",
  "/recipes": "My Recipes",
  "/kitchen": "Kitchen Essentials",
  "/diet": "Gym Diet",
  "/notes": "Notes",
  "/profile": "Profile",
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const title = routeNames[pathname] || "TheKitchenHub";
  const currentDate = format(new Date(), "EEEE, MMMM d");

  return (
    <header className="h-20 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-full"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">{currentDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-10 pl-10 pr-4 rounded-full bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64 transition-all-smooth"
          />
        </div>
        
        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-all-smooth">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        </button>
        
        <div className="w-10 h-10 rounded-full bg-secondary border-2 border-border overflow-hidden cursor-pointer">
          {/* Default avatar or photoUrl */}
          <div className="w-full h-full flex items-center justify-center text-secondary-foreground font-bold bg-primary/10">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
