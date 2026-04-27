"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { generateFireSensePDF } from "@/lib/generatePaper";

/**
 * PyroVision: Research Paper Page
 * A modern, light-themed academic reading experience.
 * Centered alignment for content from Introduction onwards.
 */

export default function PaperPage() {
  const [activeSection, setActiveSection] = useState("abstract");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    await generateFireSensePDF();
  };

  useEffect(() => {
    const sections = ["abstract", "introduction", "literature", "architecture", "results", "references"];
    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection("abstract");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#111111] font-sans selection:bg-[#f97316] selection:text-white">
      {/* SECTION 1: STICKY TOP NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 h-16 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🔥</span>
            <span className="font-bold tracking-tight text-[#111111]">
              PyroVision <span className="text-[#f97316] font-medium">Research</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center bg-[#f5f4f0] border border-black/5 rounded-full px-1 py-1 relative">
            {[
              { id: "abstract", label: "Abstract" },
              { id: "introduction", label: "Intro" },
              { id: "literature", label: "Literature" },
              { id: "architecture", label: "Architecture" },
              { id: "results", label: "Results" },
              { id: "references", label: "References" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors relative z-10 ${
                  activeSection === item.id
                    ? "text-white"
                    : "text-[#525252] hover:text-[#111111]"
                }`}
              >
                {activeSection === item.id && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-[#f97316] rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#f97316] text-white text-xs font-bold rounded-lg hover:bg-[#ea580c] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-[#525252] hover:text-[#111111] text-xs font-bold rounded-lg transition-colors border border-black/5 bg-white/50"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2: PAPER HERO HEADER (Already Centered) */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f97316]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="flex flex-col items-center gap-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] text-[10px] font-black uppercase tracking-widest">
              🔬 Computer Vision · Fire Safety · Deep Learning
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight max-w-4xl tracking-tight text-[#111111]">
              <span className="text-[#f97316]">PyroVision:</span> A Deep Learning-Based Real-Time Fire and Smoke Detection System
            </h1>
            <div className="flex flex-col gap-1">
              <p className="text-lg text-[#525252] font-medium">
                Author: Thakar Pariksihit
              </p>
              <p className="text-xs text-[#71717a] tracking-wide uppercase font-bold">
                Computer Science Research · 2025
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-12">
              {[
                { value: "96.4%", label: "Model Accuracy" },
                { value: "120ms", label: "Inference Latency" },
                { value: "3 Classes", label: "Fire · Smoke · Normal" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#fcfcfc] border border-black/5 p-8 rounded-2xl group transition-all text-center">
                  <span className="text-3xl font-black text-[#111111] tracking-tight block">{stat.value}</span>
                  <p className="text-[10px] text-[#525252] font-black uppercase tracking-widest mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 3: MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col gap-32">
        
        {/* ABSTRACT SECTION (Stay as is - Centered within main container) */}
        <section id="abstract" className="scroll-mt-24 max-w-4xl mx-auto">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f97316] mb-8 text-center">Abstract</h4>
          <div className="bg-white border border-black/5 p-10 md:p-14 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#f97316]" />
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-[#111111] italic opacity-95 text-center">
              The increasing frequency of fire-related incidents in industrial, residential, and forest environments poses a significant threat to global safety and economic stability. Traditional sensor-based fire alarm systems often suffer from high false alarm rates and delayed response times. This paper introduces PyroVision, an integrated AI-powered system designed for real-time fire and smoke detection through visual analysis. Leveraging Convolutional Neural Networks (CNNs) and deep learning, the system identifies fire and smoke patterns with high precision from live video streams. Our methodology utilizes a customized CNN architecture, optimized through transfer learning, and is deployed as a high-performance web application using a Next.js frontend and a Python-based REST API backend. Experimental results demonstrate a detection accuracy of 96.4%, with a precision of 94.8% and a recall of 95.2%. The system exhibits low inference latency, averaging 120ms per frame, facilitating early detection in smart city and IoT ecosystems.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {["Fire Detection", "Smoke Detection", "CNN", "Deep Learning", "Real-Time", "Web AI", "Computer Vision", "Next.js"].map((kw) => (
                <span key={kw} className="px-4 py-2 bg-[#f97316]/5 text-[#f97316] text-[10px] font-black rounded-full border border-[#f97316]/10 uppercase tracking-widest">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* START OF CENTERED CONTENT (INTRODUCTION ONWARDS) */}
        <div className="flex flex-col gap-32 text-center max-w-4xl mx-auto">
          
          {/* 1. INTRODUCTION SECTION */}
          <section id="introduction" className="scroll-mt-24">
            <div className="flex flex-col items-center gap-5 mb-10">
              <div className="w-10 h-2 bg-[#f97316] rounded-full mb-2" />
              <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight">1. Introduction</h2>
            </div>
            <div className="space-y-10 text-[#525252] leading-relaxed text-xl">
              <p>
                The global impact of fire disasters remains one of the most pressing challenges for public safety and property protection. According to recent statistics from international safety organizations, fire incidents account for thousands of fatalities and billions of dollars in economic losses annually. Beyond the immediate destruction of physical infrastructure, fires in natural environments, such as forest fires, contribute significantly to ecological degradation and carbon emissions, exacerbating climate change concerns.
              </p>
              <p>
                For decades, fire detection has relied heavily on traditional hardware sensors, including ionization smoke detectors, photoelectric sensors, and thermal detectors. While these devices are cost-effective, they possess inherent limitations. Ionization sensors require physical contact with combustion byproducts, meaning they can only trigger an alarm once smoke has reached the sensor's physical location.
              </p>
              
              <div className="bg-[#f97316]/5 border-2 border-dashed border-[#f97316]/20 p-10 rounded-3xl my-14 relative overflow-hidden group max-w-2xl mx-auto">
                <p className="text-[#f97316] font-black text-2xl italic leading-tight">
                  "According to the NFPA, fire departments respond to a fire every 23 seconds in the United States, highlighting the urgent need for millisecond-level detection."
                </p>
              </div>

              <p>
                The motivation behind PyroVision is to bridge the gap between advanced deep learning research and practical, user-accessible safety tools. Many existing computer vision solutions are either closed-source industrial systems or complex academic prototypes requiring specialized hardware. PyroVision addresses this by providing a unified web-based platform.
              </p>
            </div>
          </section>

          {/* 2. LITERATURE REVIEW SECTION */}
          <section id="literature" className="scroll-mt-24">
            <div className="flex flex-col items-center gap-5 mb-12">
              <div className="w-10 h-2 bg-[#f97316] rounded-full mb-2" />
              <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight">2. Literature Review</h2>
            </div>
            <div className="space-y-14">
              {[
                { title: "2.1 Traditional Systems", content: "Traditional fire detection mechanisms are primarily categorized into smoke, heat, and flame detectors. While effective in confined spaces, these systems fail in large open environments where smoke is diluted before reaching the detector." },
                { title: "2.2 Computer Vision", content: "Early research in vision-based fire detection focused on hand-crafted features and rule-based color models. However, these techniques often struggled with 'fire-like' objects, leading to high false alarm rates." },
                { title: "2.3 Deep Learning", content: "The adoption of CNNs has dramatically improved the reliability of fire detection. Models such as ResNet and YOLO have been applied to localize fire within a frame with high accuracy." },
              ].map((item) => (
                <div key={item.title} className="bg-white p-10 rounded-3xl border border-black/5 shadow-sm">
                  <h3 className="text-2xl font-black text-[#111111] italic mb-6">{item.title}</h3>
                  <p className="text-[#525252] leading-relaxed text-lg">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. SYSTEM ARCHITECTURE SECTION */}
          <section id="architecture" className="scroll-mt-24">
            <div className="flex flex-col items-center gap-5 mb-12">
              <div className="w-10 h-2 bg-[#f97316] rounded-full mb-2" />
              <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight">3. System Architecture</h2>
            </div>
            <div className="space-y-14">
              <p className="text-[#525252] leading-relaxed text-lg">
                The PyroVision architecture is designed as a full-stack decoupled web application. This ensures that the computationally intensive deep learning inference does not block the main UI thread.
              </p>
              <div className="bg-[#111111] p-10 rounded-3xl border-4 border-[#f5f4f0] font-mono text-[10px] md:text-xs text-[#f97316] overflow-x-auto shadow-2xl mx-auto max-w-full">
                <pre className="text-left inline-block">{`
  [ USER INTERFACE ] <--- (JSON Response) ---+
          |                                  |
    (Image Upload)                           |
          |                                  |
          V                                  |
  [ NEXT.JS FRONTEND ] -- (POST /predict) --> [ PYTHON BACKEND ]
                                             |
                                     [ PREPROCESSING (224x224) ]
                                             |
                                     [ CNN MODEL INFERENCE ]
                `}</pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                  <h4 className="text-lg font-black text-[#111111] mb-4">3.1 Dataset</h4>
                  <p className="text-[#525252] text-sm leading-relaxed">Trained on 10,500 balanced images with custom augmentation for varied conditions.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                  <h4 className="text-lg font-black text-[#111111] mb-4">3.2 Model</h4>
                  <p className="text-[#525252] text-sm leading-relaxed">MobileNetV2 backbone with a specialized Hazard-Detection classification head.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. EXPERIMENTAL RESULTS SECTION */}
          <section id="results" className="scroll-mt-24">
            <div className="flex flex-col items-center gap-5 mb-12">
              <div className="w-10 h-2 bg-[#f97316] rounded-full mb-2" />
              <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight">4. Results</h2>
            </div>
            <div className="space-y-12">
              <p className="text-[#525252] leading-relaxed text-xl">
                The model achieved a total accuracy of 96.4%, demonstrating exceptional robustness in distinguishing between smoke clouds and true hazards.
              </p>
              <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#f97316]">
                      <th className="px-8 py-6 text-xs font-black uppercase text-white tracking-widest">Class</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-white tracking-widest">Accuracy (%)</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-white tracking-widest">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {[
                      { class: "Fire", p: "97.1", f1: "0.969" },
                      { class: "Smoke", p: "94.2", f1: "0.938" },
                      { class: "Normal", p: "97.8", f1: "0.979" },
                    ].map((row) => (
                      <tr key={row.class} className="hover:bg-[#f5f4f0]/50 transition-colors">
                        <td className="px-8 py-6 text-sm font-black text-[#111111]">{row.class}</td>
                        <td className="px-8 py-6 text-sm text-[#525252]">{row.p}</td>
                        <td className="px-8 py-6 text-sm text-[#f97316] font-black">{row.f1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* REFERENCES SECTION */}
          <section id="references" className="scroll-mt-24 border-t-4 border-black/5 pt-28">
            <h2 className="text-3xl font-black text-[#111111] mb-12 uppercase tracking-tight">References</h2>
            <div className="space-y-8 max-w-2xl mx-auto">
              {[
                "1. B. Liu and J. Kim, 'IoT-based forest fire monitoring,' 2022.",
                "2. T. H. Chen, 'Image processing for fire detection,' IEEE, 2004.",
                "3. K. Muhammad, 'Early fire detection using CNNs,' 2018.",
                "4. M. Sandler, 'MobileNetV2 Architecture,' 2018.",
              ].map((ref, i) => (
                <div key={i} className="flex gap-6 items-center justify-center group">
                  <span className="text-xs font-black text-[#f97316] shrink-0 bg-[#f97316]/10 px-2 py-1 rounded">[{i + 1}]</span>
                  <p className="text-sm text-[#71717a] font-medium group-hover:text-[#111111] transition-colors">{ref}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-28 pb-20 border-t border-black/5 pt-12 flex flex-col items-center gap-8">
            <p className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.5em]">© 2025 PyroVision Research Group</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.2em] hover:text-[#f97316] transition-colors">
              Back to Top ↑
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
