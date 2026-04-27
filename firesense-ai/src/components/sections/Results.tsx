"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import Button from "@/components/ui/Button";
import Counter from "@/components/ui/Counter";
import { Activity } from "@phosphor-icons/react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AnimatedSection id="results" className="py-16 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <AnimatedItem>
          <EyebrowBadge label="Ablation Study Results" />
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-6 leading-tight whitespace-pre-line">
            Every Feature{"\n"}
            <span className="fire-gradient bg-clip-text text-transparent italic">Earned Its Place</span>
          </h2>
          <p className="text-zinc-600 text-lg mt-6 max-w-2xl leading-relaxed">
            We ran 6 configurations to prove what matters. Removing NDVI alone drops AUC by 0.11 \u2014 it's the single most predictive satellite signal for India.
          </p>
        </AnimatedItem>

        <AnimatedItem className="flex flex-col gap-2 items-start md:items-end">
          <div className="text-zinc-400 text-[10px] font-medium uppercase tracking-tighter">
            Verified Benchmarks (ICCV 2026 Submission)
          </div>
        </AnimatedItem>
      </div>

      {/* Comparison Table */}
      <AnimatedItem className="premium-card bg-white overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider">Model Configuration</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider text-center">AUC-ROC</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider text-center">F1 Score</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tableData.map((row, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`group transition-colors ${row.isBest ? "bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-l-4 border-fire-orange" : "hover:bg-zinc-50/50"}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">{row.config}</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 text-center">
                    <Counter value={row.auc} decimals={i === 5 ? 3 : 2} />
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 text-center">
                    <Counter value={row.f1} decimals={i === 5 ? 3 : 2} />
                  </td>
                  <td className={`px-6 py-4 text-sm ${row.isBest ? "text-fire-orange font-bold" : "text-zinc-500"}`}>
                    {row.notes}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedItem>

      {/* Stat Pills */}
      <AnimatedItem className="flex flex-wrap justify-center gap-4 mb-32">
        {[
          { label: "AUC-ROC", value: 0.891, decimals: 3 },
          { label: "Sectors Covered", value: 124, decimals: 0 },
          { label: "Training Pixels", value: 100, suffix: "K+", decimals: 0 }
        ].map((pill, i) => (
          <div key={i} className="px-6 py-2 rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
            <Counter value={pill.value} decimals={pill.decimals} suffix={pill.suffix} />
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
