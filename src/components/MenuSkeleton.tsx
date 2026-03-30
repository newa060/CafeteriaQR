import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";

export const MenuSkeleton = () => {
  return (
    <div className="px-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden bg-white/5 border-white/10 rounded-[2rem]">
          <CardContent className="p-0 flex flex-row h-36">
            {/* Image Skeleton */}
            <div className="w-[38%] h-full bg-white/5 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
              />
            </div>
            {/* Details Skeleton */}
            <div className="flex-1 p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-5 bg-white/10 rounded-lg w-3/4 overflow-hidden relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
                <div className="h-3 bg-white/5 rounded-md w-full overflow-hidden relative">
                   <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="h-6 bg-white/10 rounded-lg w-1/4" />
                <div className="h-10 bg-white/10 rounded-2xl w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
