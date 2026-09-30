"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={18} />}
          required
        />
        
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary focus:ring-primary" />
            Remember me
          </label>
          <a href="#" className="text-sm text-primary hover:underline font-medium">
            Forgot password?
          </a>
        </div>

        <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </div>
    </Card>
  );
}
