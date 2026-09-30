import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all-smooth rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft",
    secondary: "bg-secondary text-secondary-foreground hover:bg-[#E3DCB] shadow-sm",
    outline: "border-2 border-border text-foreground hover:border-primary hover:text-primary",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg",
    icon: "h-11 w-11",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
