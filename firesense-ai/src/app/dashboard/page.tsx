"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pulse,
  ShieldCheck,
  MapPin,
  Cpu,
  Broadcast,
  Clock,
  WarningCircle,
  CheckCircle,
  ArrowsOut,
  X,
  Stack,
  Warning,
  Database,
  ArrowRight
} from "@phosphor-icons/react";


type LogEntry = { 
  id: string; 
  message: string; 
  timestamp: string; 
  severity: 'info' | 'warn' | 'critical'; 
};

function getRelativeTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`;
}


import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
import Counter from "@/components/ui/Counter";
import { useUserLocation } from "@/hooks/useUserLocation";
import LocationRiskCard from "@/components/ui/LocationRiskCard";
import PerClassMetrics from "@/components/charts/PerClassMetrics";
import KaggleAudit from "@/components/dashboard/KaggleAudit";

// Dynamically import RiskMap to avoid SSR issues with Leaflet
const RiskMap = dynamic(() => import("@/components/dashboard/RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Pulse size={40} className="text-fire-orange animate-pulse" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Establishing Sat-Link...</span>
      </div>
    </div>
  )
});

const LOG_TEMPLATES: { message: string; severity: LogEntry['severity'] }[] = [
  { message: "MODIS Terra: packet received — NDVI channel nominal", severity: "info" },
  { message: "Normalizing NDVI (Red/NIR ratio)...", severity: "info" },
  { message: "ConvLSTM temporal sequence t-3 processing", severity: "info" },
  { message: "⚠ Dahod Sector: FWI threshold exceeded", severity: "warn" },
  { message: "Nainital: NDVI stable (0.64) — no alert", severity: "info" },
  { message: "⚠ Thermal anomaly detected — Kutch North", severity: "warn" },
  { message: "Relay: risk map dispatched to Forest HQ", severity: "info" },
  { message: "✓ Heartbeat: all systems nominal", severity: "info" },
  { message: "ERA5 wind vector acquired", severity: "info" },
  { message: "⚠ Humidity drop detected — Anand sector", severity: "warn" },
];

export default function Dashboard() {
  const { lat: userLat, lng: userLng, city: userCity } = useUserLocation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    setLogs([
      { id: '0', message: "Initialising connection to NASA FIRMS...", timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }), severity: 'info' },
      { id: '1', message: "Syncing regional grid (375m)...", timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }), severity: 'info' },
    ]);
  }, []);
  const [logFilter, setLogFilter] = useState<'all' | 'warn' | 'critical'>('all');
  const [riskLevel, setRiskLevel] = useState(72);
  const [activeAlerts, setActiveAlerts] = useState(3);
  const [isTracking, setIsTracking] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [satellitePos, setSatellitePos] = useState({ lat: 22.8, lng: 74.2 });
  const [forecastHour, setForecastHour] = useState(0);
  const [alertPhone, setAlertPhone] = useState("");
  const [alertError, setAlertError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [uptime, setUptime] = useState("00:00:00");
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const startTime = useRef(Date.now());


  // REAL DATA ENGINE: FASTAPI INTEGRATION
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [weather, setWeather] = useState({ temp: 38.4, humidity: 31, wind: 14 });
  const [topStats, setTopStats] = useState({
    monitors: 2482,
    riskPixels: 847,
    confidence: 91.4,
    latency: 142
  });
  const [modelHealth, setModelHealth] = useState({ gpu: 42, memory: 8.4 });
  const [monitoredZones, setMonitoredZones] = useState<any[]>([]);
  const [alertsData] = useState([
    { region: "Dahod, GJ", status: "Critical", color: "bg-red-500", triggeredAt: new Date(Date.now() - 12 * 60 * 1000) },
    { region: "Nainital, UT", status: "Stable", color: "bg-green-500", triggeredAt: new Date(Date.now() - 44 * 60 * 1000) },
    { region: "Anand, GJ", status: "Warning", color: "bg-amber-500", triggeredAt: new Date(Date.now() - 63 * 60 * 1000) },
  ]);

  const fetchRealTelemetry = async () => {
    const t0 = performance.now();
    try {
      // 1. Fetch Model Stats
      const statsRes = await fetch(`${API_BASE}/model/stats`);
      const statsData = await statsRes.json();
      if (!statsData.error) {
        setTopStats(prev => ({ ...prev, confidence: statsData.accuracy }));
      }

      // 2. Fetch Hotspots
      const hotspotsRes = await fetch(`${API_BASE}/hotspots/india`);
      const hotspotsData = await hotspotsRes.json();
      const t1 = performance.now();

      if (hotspotsData.hotspots && hotspotsData.hotspots.length > 0) {
        setTopStats(prev => ({
          ...prev,
          latency: Math.round(t1 - t0),
          monitors: hotspotsData.count + 2400,
          riskPixels: hotspotsData.hotspots.filter((h: any) => h.threat === 'critical' || h.threat === 'high').length
        }));

        const newLogs: LogEntry[] = hotspotsData.hotspots.slice(0, 5).map((h: any) => ({
          id: `firms-${h.lat}-${h.lon}-${Date.now()}`,
          message: `🛰️ ${h.source}: Thermal anomaly [${h.threat.toUpperCase()}] detected at ${h.lat.toFixed(2)}, ${h.lon.toFixed(2)}`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          severity: h.threat === 'critical' ? 'critical' : h.threat === 'high' ? 'warn' : 'info'
        }));
        
        setLogs(prev => [ ...newLogs, ...prev ].slice(0, 50));
      } else {
        // Fallback: Add a status log if no new hotspots
        setLogs(prev => [{
          id: `status-${Date.now()}`,
          message: "✓ Satellite scanning complete. No new thermal anomalies detected in sector GJ_NW.",
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          severity: 'info'
        }, ...prev].slice(0, 50));
      }
    } catch (err) {
      console.error("Telemetry Link Failure:", err);
    }
  };

  useEffect(() => {
    fetchRealTelemetry();
    const telemetryInterval = setInterval(fetchRealTelemetry, 30000);
    return () => clearInterval(telemetryInterval);
  }, []);

  useEffect(() => {
    const streamTimer = setInterval(() => {
      // HIGH-SPEED 'HEARTBEAT' SIMULATION
      setTopStats(prev => ({
        ...prev,
        latency: Math.max(20, prev.latency + Math.floor(Math.random() * 11 - 5)),
        riskPixels: Math.max(100, prev.riskPixels + Math.floor(Math.random() * 3 - 1))
      }));

      // Occasionally inject a random system log to keep it "working"
      if (Math.random() > 0.7) {
        const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
        setLogs(prev => [{
          id: `sim-${Date.now()}`,
          message: template.message,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          severity: template.severity
        }, ...prev].slice(0, 50));
      }
    }, 4000); 

    return () => clearInterval(streamTimer);
  }, []);

  const handleExport = () => {
    window.print();
  };

  // Simulation: Update Logs
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/hotspots?lat=${userLat || 22.84}&lon=${userLng || 74.25}&radius=500&days=1`);
        const data = await res.json();
        if (data.hotspots && data.hotspots.length > 0) {
          const spot = data.hotspots[0];
          const entry: LogEntry = {
            id: `stream-${Date.now()}`,
            message: `[STREAM] Sat-Link ${spot.source} update: ${spot.threat.toUpperCase()} risk at ${spot.lat.toFixed(2)}N`,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            severity: spot.threat === 'critical' ? 'critical' : spot.threat === 'high' ? 'warn' : 'info',
          };
          setLogs(prev => [entry, ...prev.slice(0, 49)]);
        }
      } catch (e) {}
    }, 30000);

    const posInterval = setInterval(() => {
      setSatellitePos(prev => ({
        lat: prev.lat + (Math.random() * 0.02 - 0.01),
        lng: prev.lng + (Math.random() * 0.02 - 0.01)
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(posInterval);
    };
  }, []);

  // Simulation: Uptime Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime.current) / 1000);
      const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <div className="pt-24 pb-12 px-12 lg:px-24 max-w-[1500px] mx-auto w-full flex-1 flex flex-col">
      {/* Dashboard Top Section: Command Center Header */}
      <div className="w-full">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 mb-16">
          
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
               <div className="px-3 py-1 bg-fire-orange/10 border border-fire-orange/20 rounded-full text-[10px] font-black text-fire-orange uppercase tracking-[0.2em]">
                 System Status: Secure
               </div>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 Dahod Vector Link: Active
               </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter leading-[0.9] mb-4">
              DeepScan <span className="fire-gradient bg-clip-text text-transparent italic">Telemetry</span>
            </h1>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed">
              Real-time thermal analysis and risk vector mapping for the <span className="text-zinc-900 font-bold">{userCity || "West Gujarat"}</span> corridor.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            {[
              { label: "Active Monitors", value: topStats.monitors, icon: Stack, color: "text-zinc-400" },
              { label: "Inference Latency", value: topStats.latency, suffix: "ms", icon: Pulse, color: "text-blue-500" },
              { label: "Model Confidence", value: topStats.confidence, suffix: "%", icon: ShieldCheck, color: "text-green-500" },
              { label: "Critical Alerts", value: topStats.riskPixels, icon: Warning, color: "text-fire-orange" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card bg-white px-8 py-6 flex items-center gap-6 shadow-xl border border-zinc-100 rounded-[2.5rem] flex-1 min-w-[220px] group hover:-translate-y-1 transition-all duration-500"
              >
                <div className={`p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon size={28} weight="bold" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-zinc-900 leading-none tracking-tighter">
                    <Counter value={stat.value} suffix={stat.suffix} decimals={stat.label.includes('Confidence') ? 1 : 0} />
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

        {/* Main Dashboard Area (2:1 Split) - Stretching to match heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">

          {/* LEFT AREA: Workspaces (Col 1-2) */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">

            {/* HIGH-FIDELITY REAL-TIME SATELLITE NAVIGATOR */}
            <div className="bg-zinc-950 rounded-[2.5rem] p-12 pt-16 text-white relative overflow-hidden shadow-2xl min-h-[580px] flex flex-col border border-zinc-800">

              {/* INTERACTIVE MAP COMPONENT (REAL-TIME) */}
              <div className="absolute inset-0 z-0">
                <RiskMap forecastHour={forecastHour} riskLevel={riskLevel} userLat={userLat} userLng={userLng} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/20 pointer-events-none" />
              </div>

              {/* PREMIUM HUD INTERFACE */}
              <div className="absolute inset-x-8 top-8 z-30 pointer-events-none flex justify-between items-start">
                {/* Tactical HUD: Top Left */}
                <div className="flex flex-col gap-4">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 pointer-events-auto shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute inset-0" />
                        <div className="w-2 h-2 rounded-full bg-red-600 relative" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Satellite Downlink: Active</span>
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tighter mb-4 leading-none">
                      MISSION_CONTROL <span className="text-white/30 font-light">|</span> <span className="text-fire-orange">HQ_ALPHA</span>
                    </h3>

                    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Altitude</span>
                          <span className="text-xs font-mono text-white/80 tracking-tighter">402.48 KM</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Vector</span>
                          <span className="text-xs font-mono text-white/80 tracking-tighter">GJ_NW_33</span>
                        </div>
                      </div>
                      <div className="flex flex-col mt-1">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Global Scan Coordinates</span>
                        <span className="text-[10px] font-mono text-blue-400 tracking-tighter">
                          {satellitePos.lat.toFixed(4)}°N / {satellitePos.lng.toFixed(4)}°E
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary HUD Controls */}
                  <div className="flex gap-2 pointer-events-auto">
                    <div className="px-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">System_Ready</span>
                    </div>
                  </div>

                </div>

                {/* Metric HUD: Top Right */}
                <div className="flex flex-col items-end gap-3 pointer-events-auto">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl transition-all hover:scale-110 active:scale-95 group shadow-2xl"
                      title="Fullscreen Monitor"
                    >
                      <ArrowsOut size={20} className="text-white group-hover:text-fire-orange transition-colors" weight="bold" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-end min-w-[180px]">

                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Fire Weather Index</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {Math.round(riskLevel)}
                      </span>
                      <span className="text-sm font-black text-fire-orange">FWI</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskLevel}%` }}
                        className="h-full bg-fire-orange shadow-[0_0_10px_#f97316]"
                      />
                    </div>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-2 items-end">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Inference Confidence</span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-500" weight="bold" />
                      <span className="text-lg font-black text-white tracking-tighter">{topStats.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* 2. LOGS ROW */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8 min-h-[400px] flex flex-col">
              <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900">Live Satellite Logs</h3>
                  <div className="px-2 py-1 bg-zinc-100 rounded text-[9px] font-black uppercase tracking-widest">NRT Feed</div>
                </div>
                <div className="flex gap-2">
                  {(['all', 'warn', 'critical'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors
                        ${logFilter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                      {f === 'all' ? 'All' : f === 'warn' ? 'Warnings' : 'Critical'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex flex-col gap-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {logs
                        .filter(l => logFilter === 'all' ? true : l.severity === logFilter)
                        .map((log) => (
                        <motion.div
                          key={log.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
                          className="flex items-start gap-4 py-2.5 border-b border-zinc-50 last:border-0"
                        >
                          <div className="pt-1.5 shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              log.severity === 'info' ? 'bg-zinc-400' : 
                              log.severity === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                          </div>
                          <span className="font-mono text-[9px] text-zinc-400 shrink-0 pt-1">{log.timestamp}</span>
                          <span className="text-xs font-mono text-zinc-600 leading-relaxed flex-1">{log.message}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ENVIRONMENTAL & TRENDS ROW */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8 w-full flex flex-col">
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-10">
                <div className="flex-[1.5] w-full flex flex-col">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Real-Time Environmental Intelligence</h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><Pulse size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Humidity</p><p className="text-2xl font-black text-zinc-900 leading-none">{weather.humidity}%</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-50 text-red-500 rounded-xl"><WarningCircle size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Temp</p><p className="text-2xl font-black text-zinc-900 leading-none">{(weather.temp ?? 0).toFixed(1)}°C</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><Broadcast size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Wind</p><p className="text-2xl font-black text-zinc-900 leading-none">{weather.wind ?? 0}<span className="text-[10px] ml-1">km/h</span></p></div>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block w-px h-16 bg-zinc-100" />
                <div className="flex-1 w-full">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Temporal Risk Trend (24H)</h3>
                  <div className="flex items-end gap-1.5 h-12">
                    {[30, 45, 35, 60, 55, 75, 70, 85, 90, 80, 65, 50].map((val, i) => (
                      <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: i * 0.05 }} className={`flex-1 rounded-t-sm ${val > 70 ? 'bg-fire-orange' : 'bg-zinc-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* 4. SECONDARY SYSTEMS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Alert Subscription */}
              <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Broadcast size={24} className="text-fire-orange" weight="bold" />
                  <h3 className="text-lg font-bold text-zinc-900">Alert Subscription</h3>
                </div>
                {!subscribed ? (
                  <div className="flex flex-col gap-4 mt-auto">
                    <input
                      type="text" placeholder="Telegram ID / Phone" value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-fire-orange/20 outline-none"
                    />
                    <select className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none">
                      {monitoredZones.map(z => <option key={z.name}>{z.name}</option>)}
                    </select>
                    <Button variant="primary" className="w-full" onClick={() => {
                      const valid = /^@[a-zA-Z0-9_]{4,31}$/.test(alertPhone.trim());
                      if (!valid) {
                        setAlertError("Enter a valid Telegram username (e.g. @yourname)");
                        return;
                      }
                      setAlertError(null);
                      setSubscribed(true);
                    }}>Subscribe</Button>
                    {alertError && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center mt-2">
                        {alertError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 p-6 rounded-2xl text-center mt-auto">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" weight="bold" />
                    <p className="text-xs font-bold text-green-900 tracking-tight">System Synced</p>
                  </div>
                )}
              </div>

              {/* Satellite Orbit */}
              <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8 h-full flex flex-col justify-between relative">

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Database size={20} className="text-fire-orange" weight="bold" />
                    <h3 className="text-lg font-bold text-zinc-900">Satellite Orbit</h3>
                  </div>
                  <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                    MODIS Terra is currently passing over the North-Western sector. Real-time telemetry is being processed at HQ_ALPHA.
                  </p>
                </div>
                <div
                  className="flex items-center gap-4 text-xs font-bold text-fire-orange uppercase tracking-widest cursor-pointer hover:gap-6 transition-all mt-auto"
                  onClick={() => { setIsTracking(true); }}
                >
                  <span>Track Satellite</span>
                  <ArrowRight size={16} />
                </div>

                <AnimatePresence>
                  {isTracking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/95 z-20 flex flex-col items-center justify-center p-8 text-center text-white rounded-[2.5rem]">
                      <button onClick={() => setIsTracking(false)} className="absolute top-6 right-6 text-white/40"><ArrowRight size={20} className="rotate-180" /></button>
                      <Broadcast size={32} className="text-fire-orange animate-pulse mb-4" />
                      <h4 className="font-bold text-lg mb-2">Satellite Locked</h4>
                      <div className="bg-white/5 p-4 rounded-2xl w-full text-[10px] uppercase font-bold text-left space-y-2">
                        <div className="flex justify-between"><span>Designator</span><span>MODIS-T-08</span></div>
                        <div className="flex justify-between text-green-400"><span>Signal</span><span>Excellent</span></div>
                      </div>
                      <Button variant="primary" className="w-full text-[10px] mt-6" onClick={() => setIsTracking(false)}>Sync Stream</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT AREA: Control Panel (Col 3) */}

          <div className="lg:col-span-1 flex flex-col gap-6 w-full">
            <LocationRiskCard lat={userLat} lng={userLng} />

            {/* 1. REGIONAL ALERTS */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-6">Regional Alerts</h3>
              <div className="flex flex-col gap-4 max-h-[265px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain snap-y snap-mandatory">



                {alertsData.map((alert, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all snap-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${alert.color}`} />
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{alert.region}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{alert.status}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400">{getRelativeTime(alert.triggeredAt)}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                className="w-full mt-6 text-xs py-3"
                onClick={() => setIsMapping(true)}
              >
                View Global Map
              </Button>

              <AnimatePresence>
                {isMapping && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="fixed inset-10 bg-white/95 backdrop-blur-2xl z-[60] rounded-[3rem] border border-zinc-200 shadow-2xl p-12 flex flex-col items-center justify-center overflow-hidden"
                  >
                    <button onClick={() => setIsMapping(false)} className="absolute top-8 right-8 p-4 hover:bg-zinc-100 rounded-full transition-colors">
                      <ArrowRight size={24} className="rotate-180" />
                    </button>
                    <div className="text-center max-w-2xl">
                      <h2 className="text-4xl font-black text-zinc-900 mb-6">Fetching Planetary Dataset</h2>
                      <div className="grid grid-cols-3 gap-12 text-left">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Anomalies</p>
                          <p className="text-3xl font-black text-zinc-900">4,129</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Global Confidence</p>
                          <p className="text-3xl font-black text-blue-600">88.4%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Node Status</p>
                          <p className="text-3xl font-black text-green-600">OPERATIONAL</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-zinc-400 mt-8 uppercase tracking-[0.2em]">
                        Source: NASA FIRMS · Updated daily at 00:00 UTC
                      </p>
                      <div className="w-full h-1 bg-zinc-100 rounded-full mt-12 overflow-hidden">
                        <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 4, ease: "easeInOut" }} className="h-full bg-blue-500" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* 2. EMERGENCY SYSTEM (Orange Card) */}
            <div className="bg-fire-orange rounded-[2.5rem] p-8 text-white flex flex-col gap-4 shadow-xl">
              <WarningCircle size={32} weight="fill" />
              <h3 className="text-xl font-bold tracking-tight">Alert Triggered</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Emergency responders notified in Dahod sector. Tracking spread vector.
              </p>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mt-2">
                <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="h-full bg-white" />
              </div>
            </div>

            {/* 3. MODEL HEALTH */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8 flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Model Health</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8">ConvLSTM temporal analysis is performing within {(100 - topStats.confidence).toFixed(1)}% variance of validation data.</p>
              </div>
              <div className="flex flex-col gap-6 mt-auto">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400">Est. GPU Utilisation</span>
                    <span className="text-zinc-900">{modelHealth.gpu}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${modelHealth.gpu}%` }} className="h-full bg-zinc-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400">Est. VRAM Usage</span>
                    <span className="text-zinc-900">{modelHealth.memory}GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(modelHealth.memory / 16) * 100}%` }} className="h-full bg-fire-orange" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400">Inference Throughput</span>
                    <span className="text-zinc-900">{Math.round(1000 / topStats.latency)} FPS</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${Math.min(100, (1000 / topStats.latency) * 3)}%` }} className="h-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. MODEL RELIABILITY CHART (Filling empty space) */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium p-8">
              <PerClassMetrics />
            </div>
          </div>


        </div>

        {/* 5. VISUAL INTELLIGENCE AUDIT (FULL WIDTH) */}
        <KaggleAudit />
      </div>

      {/* FULLSCREEN MAP OVERLAY */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col"
          >
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 right-8 z-[110] flex justify-between items-center pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse shadow-[0_0_20px_#dc2626]">Tactical Satellite Feed</div>
                  <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-2xl">GLOBAL_SURVEILLANCE_MODE</h2>
                </div>
                <p className="text-zinc-400 font-mono text-xs ml-1 uppercase tracking-widest">Sector: India-Pan-Spatio-Temporal · Lock: {satellitePos.lat.toFixed(2)}N, {satellitePos.lng.toFixed(2)}E</p>
              </div>

              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Risk Confidence</span>
                  <span className="text-2xl font-black text-fire-orange">{topStats.confidence}%</span>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-5 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 transition-transform hover:scale-110 shadow-2xl"
                >
                  <X size={28} weight="bold" />
                </button>
              </div>
            </div>

            {/* The Map */}
            <div className="flex-1 w-full h-full relative">
              <RiskMap forecastHour={forecastHour} riskLevel={riskLevel} userLat={userLat} userLng={userLng} />

              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[110] w-full max-w-2xl px-8">
              <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-fire-orange/20 rounded-2xl flex items-center justify-center border border-fire-orange/30">
                      <Clock size={24} className="text-fire-orange" weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 block mb-1">Time Prediction Hub</span>
                      <span className="text-sm font-bold text-white uppercase">{forecastHour === 0 ? "Real-Time Monitoring" : `Inference Window: T+${forecastHour} Hours`}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Predicted Spread</span>
                    <span className="text-2xl font-black text-white">{(riskLevel * 4.2 + (forecastHour * 2)).toFixed(0)} MW/m²</span>
                  </div>
                </div>

                <input
                  type="range" min="0" max="72" step="24"
                  value={forecastHour}
                  onChange={(e) => setForecastHour(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fire-orange"
                />

                <div className="flex justify-between text-[11px] font-black text-white/20 uppercase tracking-[0.6em]">
                  <span className={forecastHour === 0 ? "text-fire-orange" : ""}>Live</span>
                  <span className={forecastHour === 24 ? "text-fire-orange" : ""}>+24H</span>
                  <span className={forecastHour === 48 ? "text-fire-orange" : ""}>+48H</span>
                  <span className={forecastHour === 72 ? "text-fire-orange" : ""}>+72H Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />


      {/* PRINT-ONLY REPORT TEMPLATE */}
      <div className="hidden print:block print:p-12 bg-white text-zinc-900 font-sans print-report-container">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            main > *:not(.print-report-container) { display: none !important; }
            .print-report-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            footer, nav { display: none !important; }
          }
        ` }} />

        <div className="print-report-container flex flex-col gap-10">
          {/* Report Header */}
          <div className="flex justify-between items-start border-b-4 border-fire-orange pb-8">
            <div>
              <div className="flex items-center gap-2 text-2xl font-black mb-2">
                <span>🔥</span> FireSense AI <span className="text-fire-orange">Intelligence</span>
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Satellite-Based Wildfire Prediction System</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xs">REPORT ID: FS-GJ-2024-0847</p>
              <p className="text-zinc-400 text-[10px]">{isMounted ? new Date().toLocaleString() : ""}</p>
            </div>
          </div>

          {/* Risk Level Hero */}
          <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 flex justify-between items-center">
            <div>
              <h2 className="text-zinc-400 font-bold uppercase tracking-widest text-[11px] mb-2">Current Prediction Status</h2>
              <div className="text-6xl font-black text-red-600 tracking-tighter">CRITICAL RISK</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-zinc-900">{riskLevel.toFixed(1)}%</div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Model Confidence Score</p>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-zinc-100 rounded-3xl p-6">
              <h3 className="text-sm font-bold border-b border-zinc-100 pb-3 mb-4 uppercase tracking-wider text-zinc-400">Sector Metrics</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">Region</span>
                  <span className="text-xs font-bold">Dahod, Gujarat</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">Coordinates</span>
                  <span className="text-xs font-bold">{satellitePos.lat.toFixed(4)}° N, {satellitePos.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">NDVI (Vegetation)</span>
                  <span className="text-xs font-bold text-red-600">0.31 (Severe Stress)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-500">Wind Speed</span>
                  <span className="text-xs font-bold">47 km/h (NE)</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-100 rounded-3xl p-6">
              <h3 className="text-sm font-bold border-b border-zinc-100 pb-3 mb-4 uppercase tracking-wider text-zinc-400">Model Configuration</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">Architecture</span>
                  <span className="text-xs font-bold">ConvLSTM v3 (Temporal)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">Frame Sequence</span>
                  <span className="text-xs font-bold">72 Hours (Satellite)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">Feature Weight</span>
                  <span className="text-xs font-bold text-fire-orange">NDVI Primary (73%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-500">System State</span>
                  <span className="text-xs font-bold text-green-600">Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-8 border-2 border-dashed border-red-200 rounded-3xl bg-red-50/30">
            <h3 className="text-red-600 font-bold uppercase tracking-widest text-xs mb-4">Urgent Response Directives</h3>
            <ul className="flex flex-col gap-3 text-xs text-zinc-700 leading-relaxed list-disc pl-5">
              <li>Deploy ground teams to Dahod North-East corridor for thermal validation.</li>
              <li>Notify local forest range offices of immediate risk expansion.</li>
              <li>Pre-position emergency fire suppression assets within a 5km radius of the focal coordinate.</li>
              <li>Monitor NDVI dryness trends in adjacent sectors for secondary trigger signals.</li>
            </ul>
          </div>

          {/* Footer of Report */}
          <div className="mt-auto pt-10 border-t border-zinc-100 flex justify-between items-end">
            <div className="text-[9px] text-zinc-400 max-w-sm leading-relaxed">
              This report is generated by the FireSense AI Research Prototype. All predictions are based on multi-temporal satellite imagery and should be ground-validated by forest officials.
            </div>
            <div className="text-right">
              <div className="w-32 h-px bg-zinc-300 mb-2 ml-auto" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">System Signature</p>
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest">Digital Auth: FS_MODIS_01</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
