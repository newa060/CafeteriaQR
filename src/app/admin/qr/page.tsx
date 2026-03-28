"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";

import { 
  Download, 
  Share2, 
  Copy, 
  ExternalLink,
  QrCode as QrIcon,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

export default function QRGenerationPage() {
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // The base URL for the customer menu
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const customerUrl = `${baseUrl}/customer/${user?.cafeteriaId}/menu`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `CPS_QR_${user?.name?.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-none">Cafeteria QR Code</h1>
        <p className="text-sm sm:text-base text-gray-500 font-medium mt-2">Generate and download your unique QR code for scan-to-order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* QR Display */}
        <div className="flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-5 sm:p-8 bg-white rounded-3xl shadow-[0_20px_50px_rgba(255,107,0,0.15)] border-none">
              <div ref={qrRef}>
                <QRCode 
                  value={customerUrl} 
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <div className="mt-8 text-center text-black">
                <p className="font-extrabold text-lg uppercase tracking-tight">Scan to Pre-Order</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{user?.name || "Cafeteria Admin"}</p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card className="bg-[#111111] border-white/5 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <QrIcon className="w-5 h-5 text-primary" />
              Your Menu Link
            </h3>
            <div className="relative">
              <div className="bg-black/50 border border-white/5 rounded-2xl p-4 pr-12 text-gray-400 font-mono text-xs break-all leading-relaxed">
                {customerUrl}
              </div>
              <button 
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Copy Link"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live Link
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                QR Status: Ready
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 flex items-center gap-3"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5" />
              Download PNG Image
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold"
                onClick={() => window.open(customerUrl, "_blank")}
              >
                <ExternalLink className="w-5 h-5 mr-3" />
                Open Link
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold"
                onClick={handleCopy}
              >
                <Share2 className="w-5 h-5 mr-3" />
                Share URL
              </Button>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary leading-relaxed font-medium">
              This QR code is unique to your cafeteria. Place it on tables or at your entrance so customers can scan and pre-order their meals easily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
