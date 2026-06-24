"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedItem from "@/components/ui/AnimatedItem";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import Button from "@/components/ui/Button";

interface Particle {
  id: number;
  cx: string;
  r: number;
  duration: number;
  delay: number;
  color: string;
}

export default function FinalCTA() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generatedParticles = [...Array(8)].map((_, i) => ({
      id: i,
      cx: `${20 + Math.random() * 60}%`,
      r: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
      color: i % 2 === 0 ? "#ff4500" : "#ff8c00",
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <AnimatedSection className="relative bg-zinc-950 text-white py-32 overflow-hidden">
      {/* Radial Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fire-orange/20 rounded-full blur-[120px] pointer-events-none" />

      {/* SVG Fire Particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.cx}
            cy="100%"
            r={p.r}
            fill={p.color}
            initial={{ y: 0, opacity: 0.8 }}
            animate={{ y: -200, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        <AnimatedItem>
          <EyebrowBadge 
            label="Open Source Research" 
            className="border-fire-orange/30 bg-fire-orange/10 text-fire-orange mb-8"
          />
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            FireSense is <span className="fire-gradient bg-clip-text text-transparent italic">open.</span><br />
            Build on it.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Full model weights, training notebooks, and the GeoJSON risk zones are on GitHub. The FastAPI inference endpoint is live on HuggingFace Spaces.
          </p>
        </AnimatedItem>

        <AnimatedItem className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: "🔬", label: "Model Weights on HuggingFace" },
            { icon: "📓", label: "Jupyter Notebooks on GitHub" },
            { icon: "🌍", label: "GeoJSON Risk Zones — Free Download" },
          ].map((pill, i) => (
            <div key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-zinc-300">
              <span>{pill.icon}</span>
              {pill.label}
            </div>
          ))}
        </AnimatedItem>

        <AnimatedItem className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="primary" 
            className="px-10 py-4 text-lg"
            onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" })}
          >
            Try Live Demo
          </Button>
          <a href="https://github.com/45Hitman18/PyroVision" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="px-10 py-4 text-lg bg-transparent border-white/20 text-white hover:bg-white/5 w-full sm:w-auto">
              Star on GitHub ★
            </Button>
          </a>
        </AnimatedItem>
      </div>
    </AnimatedSection>
  );
}
