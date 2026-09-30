"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  CalendarDays, 
  ChefHat, 
  ShoppingCart, 
  Dumbbell, 
  FileText, 
  User 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Cooking Schedule", href: "/schedule", icon: CalendarDays },
  { name: "My Recipes", href: "/recipes", icon: ChefHat },
  { name: "Kitchen Essentials", href: "/kitchen", icon: ShoppingCart },
  { name: "Gym Diet", href: "/diet", icon: Dumbbell },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card h-screen hidden md:flex flex-col border-r border-border shadow-soft flex-shrink-0 relative z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
          <ChefHat size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight">TheKitchenHub</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all-smooth ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-soft" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-primary-foreground" : ""} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-secondary rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-secondary-foreground">Cook better.</p>
          <p className="text-xs text-muted-foreground mt-1">Plan smarter.</p>
        </div>
      </div>
    </aside>
  );
}
