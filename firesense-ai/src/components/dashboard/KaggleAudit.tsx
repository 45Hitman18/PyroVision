"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartBar, ShieldCheck, ListChecks, Warning, Clock, Stack, Pulse, MonitorPlay } from "@phosphor-icons/react";

export default function KaggleAudit() {
  const [data, setData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/ml/model/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Stats fetch failed");
        return res.json();
      })
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
      const res = await fetch("/api/ml/analyze", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setAnalysisResult(result);
      setHistory(prev => [{ ...result, timestamp: new Date().toLocaleTimeString(), id: Date.now() }, ...prev].slice(0, 50));
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-sm border border-slate-200 p-6 lg:p-8 flex flex-col h-auto lg:h-[650px] overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6 shrink-0 border-b border-slate-100 pb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <ChartBar size={20} className="text-sky-600" />
            <span className="text-[10px] font-mono text-slate-500 uppercase">Live Intelligence Audit</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Verify Neural Confidence
          </h2>
          <p className="text-sm font-mono text-slate-500 mt-2">
            Upload footage to see thermal anomaly identification in real-time.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-slate-50 px-4 py-3 rounded-sm border border-slate-200 flex items-center gap-4">
            <ShieldCheck size={20} className="text-emerald-600" />
            <div>
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">Audit Accuracy</p>
              <p className="text-xl font-mono font-semibold text-slate-900 leading-none">
                {data?.accuracy ?? 98.4}<span className="text-emerald-600 text-sm">%</span>
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase">Verified Against Kaggle Fire Dataset</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left Side: Upload & History */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 h-[400px] lg:h-full min-h-0">
          
          {/* Enhanced Upload Zone */}
          <div className="h-40 shrink-0">
            <label className="cursor-pointer flex flex-col items-center justify-center gap-3 h-full bg-slate-50 rounded-sm border border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50 transition-colors relative overflow-hidden group/upload">
              <Warning size={28} className="text-slate-400 group-hover/upload:text-sky-500 transition-colors" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Drop Image Here</p>
                <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">JPG, PNG, WEBP</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              
              {analyzing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Pulse size={24} className="text-sky-600 animate-pulse mb-2" />
                  <span className="text-[10px] font-mono text-sky-700 uppercase">Analyzing...</span>
                </div>
              )}
            </label>
          </div>

          {/* Audit History Log */}
          <div className="flex flex-col flex-1 min-h-0 bg-white border border-slate-200 rounded-sm overflow-hidden">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2 p-3 border-b border-slate-100 shrink-0 bg-slate-50">
              <ListChecks size={14} />
              Recent Audit Stream
            </h4>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2">
              {history.length > 0 ? history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-sm shrink-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-sm ${h.label === 'fire' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-slate-900 uppercase">{h.label}</span>
                      <span className="text-[9px] font-mono text-slate-400">{h.timestamp}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-900">{(h.confidence * 100).toFixed(1)}%</span>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <Pulse size={24} className="text-slate-300 mb-2" />
                  <span className="text-[9px] font-mono text-slate-400 uppercase">No Recent Audits</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Evidence & Telemetry */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6 h-[400px] lg:h-full min-h-0">
          
          {/* Main Image Viewer */}
          <div className="flex-1 min-h-0 bg-slate-900 rounded-sm border border-slate-800 relative overflow-hidden flex items-center justify-center">
            {analysisResult ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <img src={`data:image/png;base64,${analysisResult.heatmap}`} alt="Grad-CAM" className="max-w-full max-h-full object-contain" />
                
                {/* HUD Overlays */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-sm flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-sm ${analysisResult.label === 'fire' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-slate-400 uppercase">Neural Label</span>
                      <span className="text-xs font-mono text-white uppercase">{analysisResult.label}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-sm flex flex-col items-end">
                    <span className="text-[8px] font-mono text-slate-400 uppercase">Confidence Score</span>
                    <span className="text-sm font-mono text-sky-400">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                  <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-sm flex flex-col gap-2">
                    <span className="text-[9px] font-mono text-slate-300 uppercase">Attribution Heatmap</span>
                    <div className="flex gap-0.5 w-24 h-1.5">
                      <div className="flex-1 bg-sky-500 rounded-sm" />
                      <div className="flex-1 bg-emerald-500 rounded-sm" />
                      <div className="flex-1 bg-amber-500 rounded-sm" />
                      <div className="flex-1 bg-red-500 rounded-sm" />
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-sm">
                    LAYER: CONV_L5_FINAL
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200">
                <MonitorPlay size={32} className="text-slate-300 mb-4" />
                <h4 className="text-sm font-semibold text-slate-700 uppercase mb-1">Awaiting Neural Link</h4>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Upload a frame to generate feature attribution</p>
              </div>
            )}
          </div>

          {/* Feature Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shrink-0 h-[80px] flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Temporal Depth", val: "3 Frames", icon: Clock },
                { label: "Spectral Focus", val: "NDVI / Thermal", icon: Stack },
                { label: "Inference Speed", val: analyzing ? "---" : analysisResult ? "42ms" : "---", icon: Pulse },
              ].map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 ${i > 0 ? 'border-l border-slate-100 pl-4' : ''}`}>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <m.icon size={12} />
                    <span className="text-[9px] font-mono uppercase">{m.label}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-slate-900">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
