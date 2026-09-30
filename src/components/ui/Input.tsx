import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              flex h-12 w-full rounded-2xl border bg-card px-4 py-2 text-base 
              transition-all-smooth placeholder:text-muted-foreground 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:cursor-not-allowed disabled:opacity-50
              ${icon ? "pl-11" : ""}
              ${error ? "border-red-500 focus:ring-red-500" : "border-border"}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
