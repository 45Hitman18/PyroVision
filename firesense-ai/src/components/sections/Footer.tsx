"use client";

import Link from "next/link";
import { GithubLogo, LinkedinLogo, Globe } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="bg-[#f5f4f0] border-t border-zinc-200 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          
          {/* Col 1: Brand (Take 4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-lg tracking-tight">
                <span className="text-xl">🔥</span>
                <span className="font-bold text-zinc-900">FireSense</span>
                <span className="font-bold text-fire-orange">AI</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[220px]">
                India-specific wildfire risk prediction using deep learning on satellite imagery.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="https://github.com/45Hitman18" 
                target="_blank"
                className="p-2 bg-white rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
              >
                <GithubLogo size={18} weight="bold" />
              </Link>
              <Link 
                href="https://www.linkedin.com/in/thakar-parikshit-a5213a345/" 
                target="_blank"
                className="p-2 bg-white rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
              >
                <LinkedinLogo size={18} weight="bold" />
              </Link>
              <Link 
                href="https://thakar-parikshit.vercel.app" 
                target="_blank"
                className="p-2 bg-white rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
              >
                <Globe size={18} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Col 2: Links (Take 4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Resources</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                { label: "Paper (arXiv)", href: "#" },
                { label: "GitHub Repository", href: "#" },
                { label: "HuggingFace Demo", href: "#" },
                { label: "Dataset (NASA FIRMS)", href: "#" },
              ].map((link) => (
                <Link key={link.label} href={link.href} className="text-[11px] font-medium text-zinc-500 hover:text-fire-orange transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3: Tech Stack (Take 4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Built with</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                "NASA FIRMS",
                "GEE",
                "PyTorch",
                "Next.js",
                "Vercel",
              ].map((tech) => (
                <span key={tech} className="text-[10px] font-bold text-zinc-400 grayscale opacity-60">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium text-zinc-400">
          <div>
            © 2025 FireSense AI Research · MIT License
          </div>
          <div className="uppercase tracking-widest text-zinc-500 font-bold text-[9px]">
            Built for ICCV Earth Vision Workshop submission
          </div>
        </div>
      </div>
    </footer>
  );
}
