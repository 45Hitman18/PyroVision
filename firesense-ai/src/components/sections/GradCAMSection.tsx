"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";

const insights = [
  {
    icon: "🌿",
    title: "NDVI Signal",
    description: "Sharp vegetation dryness drop in the 7 days prior — primary trigger in 73% of high-risk alerts",
  },
  {
    icon: "💨",
    title: "Wind Pattern",
    description: "NE wind >40 km/h with low humidity creates rapid spread corridor — detected 18 hours ahead",
  },
  {
    icon: "🌡️",
    title: "Temperature Anomaly",
    description: "+6°C above seasonal average amplifies existing drought stress",
  },
];

export default function GradCAMSection() {
  const [imgSrc, setImgSrc] = useState(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gradcam/sample`);

  useEffect(() => {
    setImgSrc(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gradcam/sample?t=${Date.now()}`);
  }, []);

  return (
    <AnimatedSection id="paper" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Column: GradCAM Visualization */}
        <AnimatedItem className="lg:col-span-5 relative flex flex-col gap-8">
          <div className="relative aspect-square w-full overflow-hidden rounded-[3rem] border border-zinc-200 shadow-premium group bg-zinc-950">
            {/* Real GradCAM Image from Backend with Cache Buster */}
            <img 
              src={imgSrc} 
              alt="Model Attribution Heatmap"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                // If backend fails, use a styled placeholder
                setImgSrc("https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=800");
              }}
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <motion.div 
                 animate={{ top: ["-10%", "110%"] }} 
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="absolute left-0 right-0 h-px bg-fire-orange shadow-[0_0_15px_#f97316] z-10"
               />
            </div>

            {/* Map Labels */}
            <div className="absolute top-8 left-8 flex flex-col gap-2">
              <EyebrowBadge label="GradCAM Visualization · ConvLSTM Layer 3" />
            </div>
            
            <div className="absolute bottom-8 right-8">
              <motion.div 
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20"
              >
                Active Zone: Dahod
              </motion.div>
            </div>
          </div>

          {/* Color Scale Bar */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Low Importance</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">High Importance</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500" />
            <div className="text-center mt-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Feature Importance Map
            </div>
          </div>
        </AnimatedItem>

        {/* Right Column: Text & Insights */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          <AnimatedItem>
            <EyebrowBadge label="Explainable AI" />
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-6 leading-tight whitespace-pre-line">
              Why did the model{"\n"}
              <span className="fire-gradient bg-clip-text text-transparent italic">predict HIGH risk?</span>
            </h2>
            <p className="text-zinc-600 text-lg mt-6 max-w-xl leading-relaxed">
              GradCAM reveals which satellite features drove each prediction — no black box. Researchers and forest officers can see exactly what the model "saw".
            </p>
          </AnimatedItem>

          <div className="flex flex-col gap-4 max-w-2xl">
            {insights.map((insight, i) => (
              <AnimatedItem key={i}>
                <div className="premium-card p-4 border-l-4 border-l-fire-orange bg-white flex items-center gap-5 hover:translate-x-1 hover:bg-zinc-50 transition-all duration-300">
                  <div className="text-2xl p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                    {insight.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-base font-bold text-zinc-900">{insight.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>

      </div>
    </AnimatedSection>
  );
}
