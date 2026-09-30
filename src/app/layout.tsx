import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TheKitchenHub",
  description: "Cook better. Plan smarter. Live healthier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#FAF9F6] text-[#333333] antialiased min-h-screen flex flex-col font-sans">
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'bg-white text-gray-800 rounded-2xl shadow-lg border border-gray-100',
              style: {
                borderRadius: '16px',
                background: '#fff',
                color: '#333',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
