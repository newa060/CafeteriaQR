"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  GraduationCap,
  Hash
} from "lucide-react";

type PanelType = "customer" | "admin" | "superadmin";

interface PanelConfig {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  showNameField: boolean;
  showFacultyField: boolean;
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
    showFacultyField: true,
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
    showFacultyField: false,
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
    showFacultyField: false,
    redirectTo: "/superadmin",
  },
};

function LoginForm({ panel }: { panel: PanelType }) {
  const config = panelConfig[panel];
  const { user, loading: authLoading, login } = useAuth();

  const searchParams = useSearchParams();
  const urlAdminId = searchParams.get("adminId") || "";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [canteenCode, setCanteenCode] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"info" | "otp" | "register">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if already logged in with the correct role
  React.useEffect(() => {
    if (!authLoading && user && user.role === panel) {
      const timer = setTimeout(() => {
        window.location.href = config.redirectTo;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, panel, config.redirectTo]);

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
        body: JSON.stringify({ email, otp: otpString, name, faculty, loginPanel: panel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (panel === "customer" && !data.userExist) {
          setStep("register");
          setMessage("Identification successful! Please complete your profile.");
        } else {
          login(data.user, config.redirectTo);
        }
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
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value && element.value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = (e.currentTarget.previousSibling as HTMLInputElement);
      if (prev) prev.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/[^0-9]/g, "").substring(0, 6);
    if (!data) return;

    const newOtp = [...otp];
    data.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(data.length, 5);
    const target = e.currentTarget.children[nextIndex] as HTMLInputElement;
    if (target) target.focus();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          faculty, 
          canteenCode: urlAdminId ? undefined : canteenCode,
          adminId: urlAdminId || undefined
        }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user, config.redirectTo);
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
            {config.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">{config.subtitle}</p>
        </div>

        <Card className="border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-8 p-5 sm:p-8">
            <AnimatePresence mode="wait">
              {step === "info" && (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-6"
                >
                  <div className="space-y-4">
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
              )}

              {step === "otp" && (
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
                    <div className="flex justify-between gap-1.5 sm:gap-2 mt-4" onPaste={handlePaste}>
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                          className="w-10 h-12 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none text-white transition-all"
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

              {step === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white">Complete Your Profile</h3>
                    <p className="text-xs text-gray-400">Finish setting up your account</p>
                  </div>

                  <div className="space-y-4">
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
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Faculty"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        className="pl-12"
                        required
                      />
                    </div>
                    {!urlAdminId && (
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="text"
                          placeholder="Canteen Code"
                          value={canteenCode}
                          onChange={(e) => setCanteenCode(e.target.value)}
                          className="pl-12 uppercase"
                          required={!urlAdminId}
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
                  </Button>
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
