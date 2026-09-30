import React from "react";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card rounded-3xl p-6 shadow-soft border border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
