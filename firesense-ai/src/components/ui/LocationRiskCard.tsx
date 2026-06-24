"use client";

import { useNearestRiskZone } from "@/hooks/useNearestRiskZone";
import RiskBadge from "./RiskBadge";
import { motion } from "framer-motion";
import { MapPin, NavigationArrow } from "@phosphor-icons/react";

interface LocationRiskCardProps {
  lat: number | null;
  lng: number | null;
}

export default function LocationRiskCard({ lat, lng }: LocationRiskCardProps) {
  const { nearest, allZones } = useNearestRiskZone(lat, lng);

  if (!nearest) return null;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-premium flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Regional Status Overview</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/20 border border-red-500/40" />
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      <div className="space-y-1">

        {allZones.map((zone, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0 group hover:bg-zinc-50/50 rounded-lg px-2 -mx-2 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-xs font-black text-zinc-900 leading-none mb-1">{zone.name}</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{zone.state}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono font-bold text-zinc-500">{zone.distance?.toFixed(0)} <span className="text-[8px] text-zinc-300 uppercase">km</span></span>
              <div className={`w-2 h-2 rounded-full shadow-sm ${zone.risk === "HIGH" ? "bg-red-500 shadow-red-200" :
                  zone.risk === "MEDIUM" ? "bg-amber-500 shadow-amber-200" :
                    "bg-teal-500 shadow-teal-200"
                }`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
