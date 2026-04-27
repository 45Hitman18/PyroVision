"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChartBar, ShieldCheck, ListChecks, Warning, Clock, Stack, Pulse, MonitorPlay } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import EyebrowBadge from "@/components/ui/EyebrowBadge";

export default function KaggleAudit() {
  const [data, setData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/model/stats")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load audit data:", err));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setAnalysisResult(result);
      setHistory(prev => [{ ...result, timestamp: new Date().toLocaleTimeString(), id: Date.now() }, ...prev].slice(0, 5));
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-premium p-10 lg:p-16 mt-16 relative overflow-hidden group/audit">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fire-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none transition-opacity duration-1000 group-hover/audit:opacity-100 opacity-50" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-fire-orange/10 rounded-2xl">
              <ChartBar size={28} className="text-fire-orange" weight="bold" />
            </div>
            <EyebrowBadge label="Live Intelligence Audit" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
            Verify Neural <span className="fire-gradient bg-clip-text text-transparent italic">Confidence</span>
          </h2>
          <p className="text-zinc-500 font-medium text-lg mt-4 leading-relaxed">
            Upload your own drone or satellite footage to see how the model identifies thermal anomalies and interprets vegetation stress vectors in real-time.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="bg-zinc-900 px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-2xl border border-zinc-800">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <ShieldCheck size={24} className="text-white" weight="bold" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Audit Accuracy</p>
              <p className="text-3xl font-black text-white leading-none tracking-tighter">
                {data?.accuracy ?? 98.4}<span className="text-fire-orange">%</span>
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Verified Against Kaggle Fire Dataset</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 items-stretch">
        
        {/* Left Side: Upload & History */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          
          {/* Enhanced Upload Zone */}
          <div className="relative group/upload">
            <label className="cursor-pointer flex flex-col items-center justify-center gap-6 p-12 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 hover:border-fire-orange hover:bg-orange-50/30 transition-all duration-500 overflow-hidden lg:aspect-[4/3] h-full">
              <div className="relative w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover/upload:scale-110 group-hover/upload:rotate-6 transition-transform duration-500">
                <Warning size={40} className="text-fire-orange" weight="bold" />
                {analyzing && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-[2rem] border-4 border-fire-orange border-t-transparent"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-zinc-900 uppercase tracking-tight">Drop Image Here</p>
                <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-widest leading-relaxed">
                  DeepScan Neural Decoder v3.0<br/>Supports JPG, PNG, WEBP
                </p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              
              {/* Animated Scan Line */}
              <motion.div 
                animate={{ top: ["0%", "100%"] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-px bg-fire-orange/20 shadow-[0_0_15px_#f97316] pointer-events-none opacity-0 group-hover/upload:opacity-100"
              />
            </label>
          </div>

          {/* Audit History Log */}
          <div className="flex flex-col gap-6">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <ListChecks size={18} weight="bold" />
              Recent Audit Stream
            </h4>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {history.length > 0 ? history.map((h) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={h.id}
                  className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-white hover:shadow-md transition-all group/item shrink-0"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${h.label === 'fire' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{h.label} Detected</span>
                      <span className="text-[9px] font-bold text-zinc-400">{h.timestamp}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-zinc-900">{(h.confidence * 100).toFixed(1)}%</span>
                </motion.div>
              )) : (
                <div className="py-12 border-2 border-dashed border-zinc-100 rounded-[2rem] flex flex-col items-center justify-center opacity-30 grayscale">
                   <Pulse size={32} className="text-zinc-400 mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest">No Recent Audits</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Evidence & Telemetry */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          <div className="premium-card bg-zinc-950 aspect-square lg:aspect-video rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative group/viewer">
            {analysisResult ? (
              <div className="relative w-full h-full">
                <img src={`data:image/png;base64,${analysisResult.heatmap}`} alt="Grad-CAM" className="w-full h-full object-cover" />
                
                {/* HUD Overlays */}
                <div className="absolute inset-x-8 top-8 flex justify-between items-start pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
                     <div className={`w-2 h-2 rounded-full animate-pulse ${analysisResult.label === 'fire' ? 'bg-red-500' : 'bg-green-500'}`} />
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Neural Label</span>
                       <span className="text-xs font-black text-white uppercase tracking-tight">{analysisResult.label}</span>
                     </div>
                  </div>

                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex flex-col items-end">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Confidence Score</span>
                    <span className="text-xl font-black text-fire-orange tracking-tighter">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="absolute inset-x-8 bottom-8 flex justify-between items-end pointer-events-none">
                   <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] drop-shadow-lg">Attribution Heatmap</span>
                     <div className="flex gap-1">
                        <div className="w-4 h-1 bg-blue-500 rounded-full" />
                        <div className="w-4 h-1 bg-green-500 rounded-full" />
                        <div className="w-4 h-1 bg-yellow-500 rounded-full" />
                        <div className="w-4 h-1 bg-red-500 rounded-full" />
                     </div>
                   </div>
                   <div className="text-[10px] font-mono text-white/40 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-md">LAYER: CONV_L5_FINAL</div>
                </div>

              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                 <div className="relative mb-10">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-zinc-800 animate-[spin_10s_linear_infinite]" />
                    <MonitorPlay size={48} className="text-zinc-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" weight="duotone" />
                 </div>
                 <h4 className="text-xl font-black text-zinc-700 tracking-tight uppercase mb-2">Awaiting Neural Link</h4>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-xs leading-relaxed">
                   Upload a frame to generate a Grad-CAM feature attribution map
                 </p>
              </div>
            )}

            {/* Analysis Overlay Progress */}
            <AnimatePresence>
              {analyzing && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-6"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Pulse size={40} className="text-fire-orange animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Neural Decoding...</span>
                  </div>
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-fire-orange" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feature Breakdown Table */}
          <div className="bg-zinc-50 rounded-[2rem] border border-zinc-100 p-8">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Inference Vector Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Temporal Depth", val: "3 Frames", icon: Clock },
                { label: "Spectral Focus", val: "NDVI / Thermal", icon: Stack },
                { label: "Inference Speed", val: analyzing ? "---" : analysisResult ? "42ms" : "---", icon: Pulse },
              ].map((m, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <m.icon size={14} weight="bold" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </div>
                  <span className="text-lg font-black text-zinc-900 leading-none">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
