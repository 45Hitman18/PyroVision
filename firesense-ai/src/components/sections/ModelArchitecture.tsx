"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import { 
  Leaf, 
  ThermometerSimple, 
  Wind, 
  Drop, 
  Mountains, 
  Stack, 
  Fire,
  ArrowClockwise,
  ArrowsOut,
  X
} from "@phosphor-icons/react";

const predictionExamples = [
  "Sector: Dahod, Gujarat · Date: 15 May 2024 · Risk: HIGH · Confidence: 91% · Trigger: NDVI drop 0.31, Wind 47km/h NE",
  "Sector: Nainital, Uttarakhand · Date: 22 Apr 2024 · Risk: MEDIUM · Confidence: 78% · Trigger: Temp +8°C anomaly, Low humidity",
  "Sector: Anand, Gujarat · Date: 03 Jun 2024 · Risk: LOW · Confidence: 94% · Trigger: Recent rainfall, NDVI stable",
];

const inputFeatures = [
  { icon: Leaf, label: "NDVI (leaf)" },
  { icon: ThermometerSimple, label: "Land Surface Temp" },
  { icon: Wind, label: "Wind Speed & Dir" },
  { icon: Drop, label: "Relative Humidity" },
  { icon: Mountains, label: "Slope/Elevation" },
  { icon: Stack, label: "Land Cover Type" },
  { icon: Fire, label: "Fire History Density" },
];

function Counter({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setHasStarted(true);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * value);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [hasStarted, value]);

  return <span ref={ref}>{count.toFixed(decimals)}</span>;
}

function FullArchitectureDiagram() {
  return (
    <svg viewBox="0 0 1200 300" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="megaFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id="megaNeon">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* BALANCED INPUT MANIFOLD */}
      <g transform="translate(80, 70)">
        {[...Array(10)].map((_, i) => (
          <motion.rect
            key={i} x={i * 10} y={i * 10} width="140" height="140" rx="12"
            fill={i === 9 ? "#3b82f615" : "#0d0d0d"}
            stroke={i === 9 ? "#3b82f6" : "#27272a"}
            strokeWidth={i === 9 ? 2 : 1}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
        <text x="70" y="180" fill="#a1a1aa" fontSize="12" textAnchor="middle" fontWeight="black" className="uppercase tracking-[0.3em]">Input Space</text>
      </g>

      {/* EVENLY SPACED CORE */}
      {[0, 1, 2].map((layerIdx) => (
        <g key={layerIdx} transform={`translate(${360 + layerIdx * 230}, 70)`}>
          <motion.rect 
            width="180" height="180" rx="30" fill="#050505" 
            stroke={layerIdx === 1 ? "#f97316" : "#27272a"} 
            strokeWidth="2" strokeOpacity="0.8"
          />
          <text x="90" y="-15" fill={layerIdx === 1 ? "#f97316" : "#a1a1aa"} fontSize="10" textAnchor="middle" fontWeight="black" className="uppercase tracking-widest">
            {layerIdx === 0 ? "Encoder" : layerIdx === 1 ? "Cell" : "Decoder"}
          </text>
          
          {/* Neural Lattice */}
          {[...Array(5)].map((_, r) => [...Array(5)].map((_, c) => (
            <motion.circle 
              key={`${r}-${c}`} cx={34 + c * 28} cy={34 + r * 28} r="2.5" fill="#18181b"
              animate={{ 
                fill: ["#18181b", layerIdx === 1 ? "#f97316" : "#3b82f6", "#18181b"],
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: (r+c+layerIdx)*0.2 }}
            />
          )))}
        </g>
      ))}

      {/* BALANCED OUTPUT */}
      <g transform="translate(1040, 100)">
        <motion.circle 
          cx="60" cy="60" r="55" fill="#ef444408" stroke="#ef4444" strokeWidth="3" 
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          filter="url(#megaNeon)"
        />
        <Fire size={40} weight="fill" x="40" y="40" className="text-red-500" />
        <text x="60" y="140" fill="#ef4444" fontSize="12" textAnchor="middle" fontWeight="black" className="uppercase tracking-[0.2em]">Output</text>
      </g>

      {/* FLOW PARTICLES - RE-ALIGNED TO CENTER */}
      {[...Array(6)].map((_, i) => (
        <motion.circle key={i} r="3" fill="url(#megaFlow)" filter="url(#megaNeon)">
          <animateMotion 
            path="M240,160 C320,160 320,160 420,160 C600,160 800,160 1040,160" 
            dur={`${3 + i * 0.5}s`} 
            begin={`${i * 0.6}s`}
            repeatCount="indefinite" 
          />
        </motion.circle>
      ))}
    </svg>
  );
}

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 800 300" className="w-full h-full max-w-4xl overflow-visible">
      <defs>
        <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <filter id="neon">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* 01: INPUT MANIFOLD */}
      <g transform="translate(40, 60)">
        {[...Array(6)].map((_, i) => (
          <motion.rect
            key={i} x={i * 10} y={i * 10} width="100" height="100" rx="12"
            fill={i === 5 ? "#3b82f615" : "#111"}
            stroke={i === 5 ? "#3b82f6" : "#27272a"}
            strokeWidth="1.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
        <text x="50" y="140" fill="#a1a1aa" fontSize="11" textAnchor="middle" fontWeight="black" className="uppercase tracking-[0.2em]">Input Cube</text>
      </g>

      {/* 02: CONVLSTM ENCODER */}
      <g transform="translate(240, 60)">
        <motion.rect 
          width="180" height="120" rx="20" fill="#09090b" stroke="#f9731630" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        />
        <text x="90" y="-15" fill="#f97316" fontSize="11" textAnchor="middle" fontWeight="black" className="uppercase tracking-widest">ConvLSTM Core</text>
        
        {/* Lattice Dots */}
        {[...Array(4)].map((_, r) => [...Array(6)].map((_, c) => (
          <motion.circle 
            key={`${r}-${c}`} cx={35 + c * 22} cy={30 + r * 20} r="2.5" fill="#27272a"
            animate={{ fill: ["#27272a", "#f97316", "#27272a"] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: (r+c)*0.2 }}
          />
        )))}
      </g>

      {/* 03: FEATURE SYNTHESIS */}
      <g transform="translate(480, 85)">
        <motion.rect 
          width="100" height="70" rx="15" fill="#18181b" stroke="#3f3f46" strokeWidth="1"
          animate={{ borderColor: ["#3f3f46", "#3b82f6", "#3f3f46"] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <text x="50" y="40" fill="#a1a1aa" fontSize="9" textAnchor="middle" fontWeight="bold" className="uppercase tracking-widest text-[8px]">Synthesis</text>
      </g>

      {/* 04: RISK HEAD */}
      <g transform="translate(640, 60)">
        <motion.circle 
          cx="60" cy="60" r="55" fill="#ef444405" stroke="#ef4444" strokeWidth="3" 
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          filter="url(#neon)"
        />
        <Fire size={32} weight="fill" x="44" y="44" className="text-red-500" />
        <text x="60" y="140" fill="#ef4444" fontSize="11" textAnchor="middle" fontWeight="black" className="uppercase tracking-widest">Inference</text>
      </g>

      {/* OPTIMIZED FLOW PARTICLES */}
      {[...Array(3)].map((_, i) => (
        <motion.circle key={i} r="3" fill="url(#flowGrad)" filter="url(#neon)">
          <animateMotion 
            path="M150,110 L240,120 L420,120 L480,120 L580,120 L640,120" 
            dur={`${3 + i}s`} 
            begin={`${i * 1}s`}
            repeatCount="indefinite" 
          />
        </motion.circle>
      ))}

      {/* CONNECTIONS */}
      <path d="M150,110 L240,120 M420,120 L480,120 M580,120 L640,120" stroke="#27272a" strokeWidth="2" strokeDasharray="6 6" />
    </svg>
  );
}

export default function ModelArchitecture() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [predictionIndex, setPredictionIndex] = useState(0);
  const [liveOffset, setLiveOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isExpanded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPredictionIndex((prev) => (prev + 1) % predictionExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const syncData = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setLiveOffset((Math.random() * 0.004) - 0.002);
      setIsSyncing(false);
    }, 800);
  };

  return (
    <AnimatedSection id="model" className="py-16 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <AnimatedItem>
          <EyebrowBadge label="Deep Learning Architecture" />
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-6 leading-tight whitespace-pre-line">
            ConvLSTM meets{"\n"}
            <span className="fire-gradient bg-clip-text text-transparent italic">Satellite Reality</span>
          </h2>
          <p className="text-zinc-600 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Unlike tabular fire models, FireSense processes multi-day image sequences — the model sees how fire evolves through time, not just a snapshot.
          </p>
        </AnimatedItem>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatedItem className="lg:col-span-2 premium-card bg-zinc-950 text-white p-8 relative overflow-hidden flex flex-col min-h-[450px]">
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-bold">Scientific Infrastructure</h3>
              <p className="text-zinc-500 text-sm mt-1">Multi-Temporal ConvLSTM • 7-Channel Feature Fusion</p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Live Processing</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            <ArchitectureDiagram />
          </div>

          <button 
            onClick={() => setIsExpanded(true)}
            className="absolute bottom-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all z-20 group"
            title="View Full Architecture"
          >
            <ArrowsOut size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-6xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Neural Pipeline Architecture</h2>
                      <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-medium">Multi-Temporal ConvLSTM • 7-Channel Feature Fusion</p>
                    </div>
                    <button 
                      onClick={() => setIsExpanded(false)}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </div>

                  <div 
                    className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] relative"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 flex items-center justify-center pt-12 pb-4 px-4 overflow-hidden min-h-[300px]">
                      <FullArchitectureDiagram />
                    </div>
                    {/* Step-by-Step Architecture Working Logic */}
                    <div className="p-12 md:p-20 max-w-6xl mx-auto pt-0">
                      <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-white mb-4">Neural Working Logic</h3>
                        <p className="text-zinc-500 max-w-2xl mx-auto">A deep dive into how FireSense processes temporal satellite sequences to identify sub-pixel risk factors.</p>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Step 1 */}
                      <div className="flex gap-8 group">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black text-xl group-hover:scale-110 transition-transform">01</div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">Spatio-Temporal Extraction</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed mb-4">The ConvLSTM kernel slides across the 7-channel input stack, extracting spatial features while maintaining a 'hidden state' that represents the land's history over the past 16 days.</p>
                          <div className="flex gap-3">
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">3x3 Kernel</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">Stride 1</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-8 group">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-fire-orange/10 border border-fire-orange/20 flex items-center justify-center text-fire-orange font-black text-xl group-hover:scale-110 transition-transform">02</div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">Cell-State Propagation</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed mb-4">Unlike standard CNNs, our gated recurrence units (GRUs) decide which features to 'forget' and which to 'remember', capturing the slow accumulation of moisture loss in vegetation canopy.</p>
                          <div className="flex gap-3">
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">Sigmoid Gating</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">ReLU Activation</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-8 group">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 font-black text-xl group-hover:scale-110 transition-transform">03</div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">Hierarchical Feature Fusion</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed mb-4">Deep layers synthesize high-level abstracts (topography/wind patterns) with low-level spectral data (NDVI/LST) to form a multi-dimensional risk coefficient manifold.</p>
                          <div className="flex gap-3">
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">Global Attention</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">1x1 Conv Head</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex gap-8 group">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black text-xl group-hover:scale-110 transition-transform">04</div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">Probabilistic Softmax Output</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed mb-4">The final layer maps the synthesized features to a 3-class risk distribution (Low, Medium, High). GradCAM gradients are then backpropagated to highlight the 'why' behind each score.</p>
                          <div className="flex gap-3">
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">Cross Entropy</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">GradCAM+ Branch</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final CTA/Note */}
                    <div className="mt-24 p-8 bg-white/5 border border-white/5 rounded-[2rem] text-center">
                      <p className="text-zinc-500 text-xs italic">All architecture parameters and weights are validated against the 2026 ICCV Benchmark Suite for wildfire detection.</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-black/40 flex justify-between items-center relative z-20 border-t border-white/5">
                  <div className="flex gap-10">
                    <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Model Complexity</p><p className="text-white text-sm font-bold">1.24M Params</p></div>
                    <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Compute Latency</p><p className="text-white text-sm font-bold">120ms / frame</p></div>
                    <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Training Corpus</p><p className="text-white text-sm font-bold">15,000+ Segments</p></div>
                  </div>
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-green-500/5 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest">Inference Optimal</span>
                  </div>
                </div>

                {/* Decorative background for modal */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-fire-orange/5 blur-[120px] pointer-events-none" />
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </AnimatedItem>

        {/* Card 2: Input Features */}
        <AnimatedItem className="premium-card p-8 bg-white border border-zinc-100 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-zinc-900">7 Input Features</h3>
          <div className="flex flex-col gap-4">
            {inputFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                  <feature.icon size={18} weight="duotone" className="text-fire-orange" />
                </div>
                <span className="text-sm font-medium text-zinc-700">{feature.label}</span>
              </div>
            ))}
          </div>
        </AnimatedItem>

        {/* Card 3: Model Stats */}
        <AnimatedItem className="premium-card p-8 bg-white border border-zinc-100 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-zinc-900">Performance</h3>
            <button 
              onClick={syncData}
              disabled={isSyncing}
              className={`p-2 rounded-full transition-all duration-300 ${isSyncing ? "bg-fire-orange/10 text-fire-orange" : "bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"}`}
              title="Manual Sync with Global Inference"
            >
              <ArrowClockwise size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">AUC-ROC Score</span>
                <span className="text-3xl font-extrabold fire-gradient bg-clip-text text-transparent"><Counter value={0.891 + liveOffset} decimals={3} /></span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: "89.1%" }} 
                  transition={{ duration: 1.5, ease: "circOut" }} 
                  className="h-full bg-gradient-to-r from-fire-orange to-fire-amber" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "F1 Score", value: 0.842, width: "84.2%" },
                { label: "Precision", value: 0.874, width: "87.4%" },
                { label: "Recall", value: 0.818, width: "81.8%" },
                { label: "Stability", value: 0.925, width: "92.5%" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                  <span className="text-lg font-bold text-zinc-900">
                    <Counter value={stat.value + liveOffset} decimals={3} />
                  </span>
                  <div className="w-full h-1 bg-zinc-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: stat.width }} 
                      className="h-full bg-zinc-200" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedItem>
        
        {/* Card 4: Temporal Risk Propagation (Filling the gap) */}
        <AnimatedItem className="lg:col-span-2 premium-card p-8 bg-white border border-zinc-100 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-zinc-900">Temporal Risk Propagation</h3>
            <div className="px-3 py-1 bg-fire-orange/10 rounded-full text-[10px] font-black text-fire-orange uppercase tracking-widest border border-fire-orange/20">
              ConvLSTM Sequential Analysis
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-between gap-4 mt-4 relative">
            {[
              { label: "T-3", desc: "Base State", intensity: "bg-zinc-100", icon: Leaf },
              { label: "T-2", desc: "Trend Detect", intensity: "bg-zinc-200", icon: Stack },
              { label: "T-1", desc: "Anomaly Lock", intensity: "bg-fire-orange/40", icon: ThermometerSimple },
              { label: "PRED", desc: "Spread Vector", intensity: "bg-fire-orange shadow-[0_0_20px_rgba(249,115,22,0.4)]", icon: Fire },
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10">
                <div className={`w-full aspect-square rounded-2xl ${step.intensity} flex flex-col items-center justify-center border border-black/5 transition-all duration-700 gap-2`}>
                  <step.icon size={24} weight={i === 3 ? "fill" : "duotone"} className={i === 3 ? "text-white animate-pulse" : "text-zinc-500"} />
                  <span className={`text-[10px] font-black ${i === 3 ? 'text-white' : 'text-zinc-400'}`}>{step.label}</span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Connecting Arrows (Animated SVGs) */}
            <div className="absolute inset-0 flex items-center justify-around px-8 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <svg key={i} className="w-12 h-4 overflow-visible" viewBox="0 0 48 16">
                  <motion.path 
                    d="M0,8 L48,8" 
                    stroke="#e4e4e7" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [-8, 0] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <path d="M40,4 L48,8 L40,12" stroke="#e4e4e7" strokeWidth="2" fill="none" />
                </svg>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed italic">
            The model propagates spatial features through recurrent memory cells, allowing it to "remember" the drying patterns observed 72 hours prior to an ignition event.
          </p>
        </AnimatedItem>

        {/* Card 4: Typewriter Prediction */}
        <AnimatedItem className="lg:col-span-3 premium-card bg-zinc-950 p-6 flex flex-col gap-4 border border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Live Prediction Output</h3>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-6 font-mono text-sm leading-relaxed min-h-[80px] flex items-center border border-zinc-900">
            <AnimatePresence mode="wait">
              <motion.p
                key={predictionIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.5 }}
                className="text-[#22c55e]"
              >
                <span className="opacity-50 mr-2">$</span>
                {predictionExamples[predictionIndex]}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block ml-1 w-2 h-4 bg-[#22c55e] align-middle"
                />
              </motion.p>
            </AnimatePresence>
          </div>
        </AnimatedItem>

      </div>
    </AnimatedSection>
  );
}
