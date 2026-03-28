import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cafeteria Pre-Order System (CPS)",
  description: "A specialized QR-based pre-ordering system for school and office cafeterias.",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 overflow-x-hidden pt-4 pb-20 sm:pb-4 px-4 sm:px-6 md:px-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
