"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  UtensilsCrossed,
  User,
} from "lucide-react";

type PanelType = "customer" | "admin" | "superadmin";

interface PanelConfig {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  showNameField: boolean;
  redirectTo: string;
}

const panelConfig: Record<PanelType, PanelConfig> = {
  customer: {
    icon: <UtensilsCrossed className="w-8 h-8 text-primary" />,
    title: (
      <>
        School Cafeteria <br />
        <span className="text-primary">Pre-Order</span>
      </>
    ),
    subtitle: "Enter your details to continue",
    showNameField: true,
    redirectTo: "/customer",
  },
  admin: {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: (
      <>
        Admin <span className="text-primary">Access</span>
      </>
    ),
    subtitle: "Sign in to the management portal",
    showNameField: false,
    redirectTo: "/admin",
  },
  superadmin: {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: (
      <>
        Super Admin <span className="text-primary">Access</span>
      </>
    ),
    subtitle: "Root access — authorised personnel only",
    showNameField: false,
    redirectTo: "/superadmin",
  },
};

function LoginForm({ panel }: { panel: PanelType }) {
  const config = panelConfig[panel];
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"info" | "otp">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("otp");
        setMessage("OTP sent to your email!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the full 6-digit OTP");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString, name, loginPanel: panel }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, config.redirectTo);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid or expired OTP");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              {config.icon}
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
            {config.title}
          </h1>
          <p className="text-gray-400">{config.subtitle}</p>
        </div>

        <Card className="border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-8 p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === "info" ? (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {config.showNameField && (
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-12"
                          required
                        />
                      </div>
                    )}
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Get OTP Code"}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-400">Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span></p>
                    <div className="flex justify-between gap-2 mt-4">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onFocus={(e) => e.target.select()}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none text-white transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {message}
                    </div>
                  )}

                  <div className="space-y-4">
                    <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Sign In"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep("info")}
                      className="w-full text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      Change email or Resend OTP?
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PanelLoginPage({ panel }: { panel: PanelType }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm panel={panel} />
    </Suspense>
  );
}
