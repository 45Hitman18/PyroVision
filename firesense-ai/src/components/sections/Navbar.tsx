"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import Link from "next/link";

const navLinks = [
  { label: "Overview", href: "/#overview" },
  { label: "Model", href: "/#model" },
  { label: "Risk Zones", href: "/#risk-zones" },
  { label: "Results", href: "/#results" },
  { label: "Dashboard", href: "/dashboard", isReal: true },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isHomePage = window.location.pathname === "/";
      setIsScrolled(!isHomePage || window.scrollY >= 50);
    };
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && window.location.pathname === "/") {
      e.preventDefault();
      const targetId = href.split("#")[1];
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else if (href.startsWith("/#")) {
      // Allow default behavior to navigate to home + hash
    } else {
      // Normal navigation
      setMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-2xl border-b border-white/30 shadow-sm py-3" 
          : "bg-transparent py-5"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "circOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <Link 
          href="#overview" 
          onClick={(e) => scrollToSection(e, "#overview")}
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">🔥</span>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-black tracking-tight transition-colors ${isScrolled ? "text-zinc-900" : "text-white"}`}>FireSense</span>
            <span className={`text-xl font-black tracking-tight transition-colors ${isScrolled ? "text-fire-orange" : "text-white drop-shadow-sm"}`}>AI</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className={`text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                link.isReal ? "text-fire-orange" :
                isScrolled ? "text-zinc-600 hover:text-zinc-900" : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
              {link.isReal && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fire-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-fire-orange"></span>
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/paper">
            <Button 
              variant="secondary" 
              className={`px-5 py-2 text-xs group transition-all ${isScrolled ? "bg-zinc-50 border-zinc-200" : "bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"}`}
            >
              <span className="flex items-center gap-1.5">
                <span>Read Paper</span>
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </span>
            </Button>
          </Link>
          <Link href="/#playground">
            <Button 
              variant="primary" 
              className="px-5 py-2 text-xs"
            >
              Live Demo
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className={`md:hidden p-2 ${isScrolled ? "text-zinc-900" : "text-white"}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white border-b border-zinc-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`text-lg font-bold flex items-center justify-between ${link.isReal ? "text-fire-orange" : "text-zinc-900 hover:text-fire-orange"}`}
                >
                  {link.label}
                  {link.isReal && (
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest px-2 py-0.5 bg-fire-orange/10 rounded-full">
                      Live
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fire-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-fire-orange"></span>
                      </span>
                    </span>
                  )}
                </Link>
              ))}
              <hr className="border-zinc-100 my-2" />
              <div className="flex flex-col gap-3">
                <Link href="/paper" className="w-full">
                  <Button 
                    variant="secondary" 
                    className="w-full"
                  >
                    Read Paper →
                  </Button>
                </Link>
                <Link href="/#playground" className="w-full">
                  <Button 
                    variant="primary" 
                    className="w-full"
                  >
                    Live Demo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
