"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import RiskBadge from "@/components/ui/RiskBadge";

const riskData = [
  {
    level: "low" as const,
    title: "Low Risk Zones",
    description: "Dense forest, high humidity, stable wind — 62% of monitored area",
  },
  {
    level: "medium" as const,
    title: "Medium Risk Zones",
    description: "Dry vegetation, seasonal variation — 28% of monitored area",
  },
  {
    level: "high" as const,
    title: "High Risk Zones",
    description: "Critical NDVI drop + high wind — 10% of monitored area. Immediate alert triggered.",
  },
];

export default function RiskZoneMap() {
  return (
    <AnimatedSection id="risk-zones" className="py-24 px-6 max-w-7xl mx-auto relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Column: Text & Cards */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <AnimatedItem>
            <EyebrowBadge label="Risk Zone Analysis" />
          </AnimatedItem>
          
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-4 leading-tight">
            Three Zones.<br />
            <span className="fire-gradient bg-clip-text text-transparent italic">One Clear Picture.</span>
          </h2>

          <AnimatedItem>
            <p className="text-zinc-600 text-lg mt-6 leading-relaxed">
              Our ConvLSTM model classifies every 375m pixel into three risk categories based on NDVI, temperature, wind speed, slope, and historical fire density.
            </p>
          </AnimatedItem>

          <div className="flex flex-col gap-4">
            {riskData.map((item, i) => (
              <AnimatedItem key={i}>
                <div className="premium-card p-6 flex flex-col gap-3 group hover:translate-x-1 transition-transform">
                  <RiskBadge level={item.level} />
                  <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>

        {/* Right Column: SVG Map */}
        <AnimatedItem className="lg:col-span-7 relative h-full flex items-center justify-center bg-zinc-900 rounded-[3rem] border border-white/10 p-12 md:p-16 shadow-2xl overflow-hidden min-h-[600px]">
          {/* Decorative Background for Dark Mode */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-fire-orange/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fire-amber/5 blur-[80px] pointer-events-none" />
          
          <div className="relative w-full max-w-md z-10">
            <svg
              viewBox="0 0 200 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-2xl"
            >
              {/* Simplified India Path */}
              <motion.path
                d="M100 10 L120 20 L130 40 L140 60 L150 90 L160 120 L150 150 L120 200 L100 230 L80 200 L50 150 L40 120 L30 90 L40 60 L50 40 L70 20 Z"
                stroke="#d4d4d8"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              {/* Gujarat Highlight (West) */}
              <motion.path
                d="M40 90 L55 95 L50 115 L35 110 Z"
                fill="#ef4444"
                fillOpacity="0.6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="cursor-pointer"
              />

              {/* Uttarakhand Highlight (North) */}
              <motion.path
                d="M85 35 L105 40 L100 55 L80 50 Z"
                fill="#f59e0b"
                fillOpacity="0.6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              />

              {/* Pulsing Dots */}
              {[
                { x: 45, y: 100, color: "bg-risk-high" }, // Gujarat
                { x: 95, y: 45, color: "bg-risk-medium" }, // Uttarakhand
                { x: 100, y: 120, color: "bg-risk-low" }, // Central
              ].map((dot, i) => (
                <foreignObject key={i} x={dot.x - 5} y={dot.y - 5} width="10" height="10">
                  <div className="relative w-full h-full">
                    <motion.div
                      className={`absolute inset-0 rounded-full ${dot.color}`}
                      animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                    />
                    <div className={`absolute inset-[25%] rounded-full ${dot.color} border border-white`} />
                  </div>
                </foreignObject>
              ))}
            </svg>

            {/* Map Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 p-4 bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk-low" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk-medium" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Med</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk-high" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">High</span>
              </div>
            </div>

            {/* Region Annotations - Safe positioning */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] -rotate-90">ARABIAN SEA</div>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] rotate-90">BAY OF BENGAL</div>
            </div>
          </div>
        </AnimatedItem>

      </div>
    </AnimatedSection>
  );
}
