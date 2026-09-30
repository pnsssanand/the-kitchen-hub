import React from "react";
import { ChefHat } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 shadow-soft">
          <ChefHat size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">TheKitchenHub</h1>
        <p className="text-muted-foreground">Cook better. Plan smarter. Live healthier.</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
