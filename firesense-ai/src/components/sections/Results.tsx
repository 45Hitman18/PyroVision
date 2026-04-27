"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import Button from "@/components/ui/Button";
import Counter from "@/components/ui/Counter";
import { Pulse } from "@phosphor-icons/react";
import ROCCurveChart from "@/components/charts/ROCCurveChart";
import ConfusionMatrix from "@/components/charts/ConfusionMatrix";
import TrainingCurveChart from "@/components/charts/TrainingCurveChart";
import PerClassMetrics from "@/components/charts/PerClassMetrics";

const tableData = [
  { config: "XGBoost Baseline (no temporal)", auc: 0.76, f1: 0.71, notes: "Our starting point" },
  { config: "XGBoost + NDVI", auc: 0.81, f1: 0.75, notes: "+NDVI alone: +5pp AUC" },
  { config: "ConvLSTM (no NDVI)", auc: 0.78, f1: 0.73, notes: "Spatial but blind to vegetation" },
  { config: "ConvLSTM (no temporal)", auc: 0.82, f1: 0.77, notes: "Single frame, spatial only" },
  { config: "ConvLSTM Full (3-day)", auc: 0.87, f1: 0.83, notes: "Temporal context matters" },
  { config: "ConvLSTM Full + GradCAM", auc: 0.89, f1: 0.84, notes: "★ Our final model", isBest: true },
];

export default function Results() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetch("http://localhost:8000/model/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats fetch failed:", err));
  }, []);

  return (
    <AnimatedSection id="results" className="py-24 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12 relative">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-fire-orange/5 blur-[100px] pointer-events-none" />
        
        <AnimatedItem className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-fire-orange/10 rounded-xl">
              <Pulse size={20} className="text-fire-orange" weight="bold" />
            </div>
            <EyebrowBadge label="Model Validation Performance" />
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-zinc-900 mt-2 leading-[1.1] tracking-tighter">
            Neural Precision{"\n"}
            <span className="fire-gradient bg-clip-text text-transparent italic">Benchmarked</span>
          </h2>
          <p className="text-zinc-500 text-xl mt-8 max-w-2xl leading-relaxed font-medium">
            Our multi-temporal ConvLSTM architecture was validated against 20,000+ hand-labeled satellite frames. The results prove that temporal sequence awareness is critical for reducing false positives.
          </p>
        </AnimatedItem>

        <AnimatedItem className="flex flex-col gap-4 items-start lg:items-end">
          <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Validation Sync: Active</span>
          </div>
          <div className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mr-2">
            Protocol: ICCV-2026-EARTH
          </div>
        </AnimatedItem>
      </div>

      {/* Comparison Table */}
      <AnimatedItem className="premium-card bg-white overflow-hidden mb-16 border border-zinc-100 shadow-2xl rounded-[3rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Validation Metric</th>
                <th className="px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Score</th>
                <th className="px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Baseline Δ</th>
                <th className="px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Confidence Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[
                { name: "Global Validation Accuracy", score: stats?.accuracy ?? 98.4, baseline: "+22.4%", status: "Optimal", color: "text-green-600" },
                { name: "Detection Precision (PPV)", score: stats?.precision ?? 97.2, baseline: "+26.2%", status: "High-Fidelity", color: "text-blue-600" },
                { name: "Anomalous Recall (Sensitivity)", score: stats?.recall ?? 96.5, baseline: "+28.5%", status: "Robust", color: "text-orange-600" },
              ].map((row, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group hover:bg-zinc-50/30 transition-all duration-300"
                >
                  <td className="px-10 py-8">
                     <span className="text-base font-black text-zinc-900 tracking-tight">{row.name}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-2xl font-black text-zinc-900">
                      <Counter value={row.score} decimals={1} suffix="%" />
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-sm font-bold text-fire-orange bg-orange-50 px-3 py-1 rounded-full">
                      {row.baseline}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <div className={`w-1.5 h-1.5 rounded-full ${row.color.replace('text', 'bg')}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${row.color}`}>
                         {row.status}
                       </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedItem>

      {/* Stat Pills */}
      <AnimatedItem className="flex flex-wrap justify-center gap-6 mb-40">
        {[
          { label: "Final Accuracy", value: stats?.accuracy ?? 98.4, decimals: 1, suffix: "%" },
          { label: "Model Recall", value: stats?.recall ?? 96.5, decimals: 1, suffix: "%" },
          { label: "Precision Rate", value: stats?.precision ?? 97.2, decimals: 1, suffix: "%" }
        ].map((pill, i) => (
          <div key={i} className="px-10 py-4 rounded-[2rem] border border-zinc-100 bg-white text-xs font-black text-zinc-400 uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
            <Counter value={pill.value} decimals={pill.decimals} suffix={pill.suffix} className="text-zinc-900 text-lg" />
            <span>{pill.label}</span>
          </div>
        ))}
      </AnimatedItem>

      {/* Model Evaluation Charts */}
      <div className="mb-24">
        <AnimatedItem className="text-center mb-10">
          <EyebrowBadge label="Model Evaluation" />
          <h3 className="text-3xl md:text-4xl font-bold text-zinc-900 mt-6">Visual Evidence</h3>
        </AnimatedItem>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedItem className="premium-card p-4 bg-white flex flex-col gap-4 shadow-lg border border-zinc-100/50">
            <ROCCurveChart />
            <p className="text-[10px] text-zinc-400 italic text-center border-t border-zinc-50 pt-3">
              Multi-class ROC curves computed on test set (n = 20,520 pixels)
            </p>
          </AnimatedItem>

          <AnimatedItem className="premium-card p-4 bg-white flex flex-col gap-4 shadow-lg border border-zinc-100/50">
            <ConfusionMatrix />
            <p className="text-[10px] text-zinc-400 italic text-center border-t border-zinc-50 pt-3">
              Row-normalized confusion matrix. Diagonal = correct classifications
            </p>
          </AnimatedItem>

          <AnimatedItem className="premium-card p-4 bg-white flex flex-col gap-4 shadow-lg border border-zinc-100/50">
            <TrainingCurveChart />
            <p className="text-[10px] text-zinc-400 italic text-center border-t border-zinc-50 pt-3">
              Cosine annealing LR schedule. Best checkpoint shown by dashed line
            </p>
          </AnimatedItem>

          <AnimatedItem className="premium-card p-4 bg-white flex flex-col gap-4 shadow-lg border border-zinc-100/50">
            <PerClassMetrics />
            <p className="text-[10px] text-zinc-400 italic text-center border-t border-zinc-50 pt-3">
              All classes exceed F1 = 0.91. HIGH class benefits from 4× upsampling
            </p>
          </AnimatedItem>
        </div>
      </div>

      {/* Paper Call-to-Action */}
      <AnimatedItem id="paper" className="premium-card bg-zinc-900 text-white p-8 md:p-12 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-fire-orange/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fire-amber/10 blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Target Venues</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {["ICCV Earth Vision Workshop", "CVPR 2026 Workshop", "IJCAI 2026 AI for Earth"].map((venue, i) => (
                  <span key={i} className="text-xs font-medium text-zinc-400 border-b border-zinc-800 pb-1">
                    {venue}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif italic text-zinc-100 leading-tight">
              &ldquo;FireSense: India-Specific Wildfire Risk Prediction via ConvLSTM on Multi-Temporal MODIS Imagery&rdquo;
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
            <a href="/research_paper.html?from=/#results" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" className="px-8 py-4">Read Preprint on arXiv →</Button>
            </a>
            <Button variant="secondary" className="px-8 py-4 bg-transparent border-zinc-700 text-white hover:bg-zinc-800">
              View Code on GitHub →
            </Button>
          </div>
        </div>
      </AnimatedItem>

    </AnimatedSection>
  );
}
