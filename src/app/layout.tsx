import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MenuQR - Cafeteria System",
  description: "A specialized QR-based pre-ordering system for school and office cafeterias.",
};

import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1 overflow-x-hidden pb-20 sm:pb-4">
                {children}
              </main>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
