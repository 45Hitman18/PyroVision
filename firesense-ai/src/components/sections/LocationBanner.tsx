"use client";

import { useUserLocation } from "@/hooks/useUserLocation";
import { useNearestRiskZone } from "@/hooks/useNearestRiskZone";
import { motion, AnimatePresence } from "framer-motion";
import RiskBadge from "@/components/ui/RiskBadge";
import { MapPin, Warning, ArrowClockwise, Globe } from "@phosphor-icons/react";

export default function LocationBanner() {
  const { lat, lng, city, country, isLoading, error, isSupported } = useUserLocation();
  const { nearest, distanceKm } = useNearestRiskZone(lat, lng);

  const isIndia = country?.toLowerCase() === "india";

  return (
    <div className="w-full bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 h-12 overflow-hidden relative z-[45]">
      <div className="max-w-[1400px] mx-auto h-full px-8 md:px-12 lg:px-24 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-fire-orange animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                Detecting your location...
              </span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-6"
            >
              <div className="flex items-center gap-2 text-white/60">
                <Warning size={14} className="text-fire-orange" weight="bold" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{error === "Permission denied" ? "Enable location for personalized risk alerts" : error}</span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 text-[10px] font-black text-fire-orange uppercase tracking-widest hover:text-white transition-colors"
              >
                <ArrowClockwise size={14} weight="bold" />
                Retry
              </button>
            </motion.div>
          ) : !isIndia && country ? (
            <motion.div
              key="outside"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 text-white/60"
            >
              <Globe size={16} weight="bold" className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                FireSense monitors Gujarat & Uttarakhand — your location ({city}) is outside the active monitoring zone
              </span>
            </motion.div>
          ) : nearest ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-8"
            >
              <div className="flex items-center gap-3 text-white">
                <MapPin size={18} weight="fill" className="text-fire-orange" />
                <span className="text-xs font-black uppercase tracking-tight">
                  Nearest Risk Zone: <span className="text-fire-orange">{nearest.name}</span>
                </span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {distanceKm?.toFixed(1)} km away
                </span>
              </div>
              <RiskBadge level={nearest.risk.toLowerCase() as "low" | "medium" | "high"} className="scale-75 origin-left" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
