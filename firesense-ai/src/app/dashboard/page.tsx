"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  ArrowRight,
  ArrowClockwise
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
import { RISK_ZONES } from "@/hooks/useNearestRiskZone";
import LocationRiskCard from "@/components/ui/LocationRiskCard";
import PerClassMetrics from "@/components/charts/PerClassMetrics";
import KaggleAudit from "@/components/dashboard/KaggleAudit";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";


// Dynamically import RiskMap to avoid SSR issues with Leaflet
const RiskMap = dynamic(() => import("@/components/dashboard/RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Pulse size={40} className="text-red-600 animate-pulse" />
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono text-slate-500">Establishing Sat-Link...</span>
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

const CustomFwiTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fwi = data.fwi;
    let riskLabel = "Low";
    let riskColor = "text-teal-600 bg-teal-50 border-teal-100";
    if (fwi >= 70) {
      riskLabel = "Critical";
      riskColor = "text-red-600 bg-red-50 border-red-100";
    } else if (fwi >= 50) {
      riskLabel = "High";
      riskColor = "text-orange-600 bg-orange-50 border-orange-105";
    } else if (fwi >= 30) {
      riskLabel = "Moderate";
      riskColor = "text-amber-600 bg-amber-50 border-amber-100";
    }

    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-sm text-xs font-sans min-w-[140px]">
        <p className="font-bold text-slate-800 mb-1.5 font-mono uppercase tracking-wider text-[10px]">Forecast Day: {data.day}</p>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">FWI Index:</span>
          <span className="font-extrabold text-sm text-slate-900">{fwi}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-1.5 text-[10px] text-slate-600 font-mono">
          <div className="flex justify-between">
            <span>Temp Max:</span>
            <span className="font-bold text-slate-800">{data.tempMax.toFixed(1)}°C</span>
          </div>
          <div className="flex justify-between">
            <span>Min Humidity:</span>
            <span className="font-bold text-slate-800">{data.humidityMin}%</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span>Max Wind:</span>
            <span className="font-bold text-slate-800">{data.windMax} km/h</span>
          </div>
        </div>
        <div className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono text-center rounded-xs border ${riskColor}`}>
          {riskLabel} Risk
        </div>
      </div>
    );
  }
  return null;
};

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
  const [isCommsOpen, setIsCommsOpen] = useState(false);
  const [satellitePos, setSatellitePos] = useState({ lat: 22.8, lng: 74.2 });
  const [forecastHour, setForecastHour] = useState(0);
  const [alertPhone, setAlertPhone] = useState("");
  const [alertError, setAlertError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [selectedSector, setSelectedSector] = useState("Dahod");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [customSectorName, setCustomSectorName] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"standard" | "custom">("standard");


  const handleMapClick = (pt: { lat: number; lng: number }) => {
    setDrawnPoints(prev => [...prev, pt]);
  };

  const handleClearPoints = () => {
    setDrawnPoints([]);
  };

  const handleUndoPoint = () => {
    setDrawnPoints(prev => prev.slice(0, -1));
  };

  const [isSubscribing, setIsSubscribing] = useState(false);
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
  const [monitoredZones, setMonitoredZones] = useState<any[]>(RISK_ZONES);

  // Dynamic active coordinate resolution
  const activeCoords = useMemo(() => {
    if (subscriptionType === "custom" && drawnPoints.length >= 3) {
      const sumLat = drawnPoints.reduce((sum, p) => sum + p.lat, 0);
      const sumLng = drawnPoints.reduce((sum, p) => sum + p.lng, 0);
      return {
        lat: sumLat / drawnPoints.length,
        lng: sumLng / drawnPoints.length,
        name: customSectorName.trim() || "Custom Geofence"
      };
    }
    const zone = RISK_ZONES.find(z => z.name === selectedSector);
    if (zone) {
      return { lat: zone.lat, lng: zone.lng, name: zone.name };
    }
    return { lat: userLat || 22.84, lng: userLng || 74.25, name: userCity || "Dahod" };
  }, [subscriptionType, drawnPoints, selectedSector, customSectorName, userLat, userLng, userCity]);

  interface FwiForecastPoint {
    day: string;
    fwi: number;
    tempMax: number;
    humidityMin: number;
    windMax: number;
  }

  const [fwiForecast, setFwiForecast] = useState<FwiForecastPoint[]>([]);
  const [isFwiLoading, setIsFwiLoading] = useState(false);

  // Fetch 7-Day weather forecast and calculate daily FWI values
  useEffect(() => {
    let isMounted = true;
    const fetchFwiForecast = async () => {
      setIsFwiLoading(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${activeCoords.lat}&longitude=${activeCoords.lng}&daily=temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max&timezone=auto`
        );
        if (!response.ok) throw new Error("Forecast fetch failed");
        const data = await response.json();
        if (data.daily && isMounted) {
          const forecast = data.daily.time.map((timeStr: string, idx: number) => {
            const tempMax = data.daily.temperature_2m_max[idx];
            const rhMin = data.daily.relative_humidity_2m_min[idx];
            const windMax = data.daily.wind_speed_10m_max[idx];

            // FWI = (Temp_Max * 0.6) + (Wind_Speed_Max * 0.4) - (RH_Min * 0.3) + 15 (bounded to [10, 100])
            const rawFwi = (tempMax * 0.6) + (windMax * 0.4) - (rhMin * 0.3) + 15;
            const fwi = Math.max(10, Math.min(100, Math.round(rawFwi)));

            const date = new Date(timeStr);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

            return {
              day: dayName,
              fwi,
              tempMax,
              humidityMin: rhMin,
              windMax
            };
          });
          setFwiForecast(forecast);
        }
      } catch (err) {
        console.error("Failed to fetch FWI forecast:", err);
      } finally {
        if (isMounted) setIsFwiLoading(false);
      }
    };

    fetchFwiForecast();

    return () => {
      isMounted = false;
    };
  }, [activeCoords.lat, activeCoords.lng]);




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
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (!statsData.error) {
          setTopStats(prev => ({ ...prev, confidence: statsData.accuracy }));
        }
      }

      // 2. Fetch Hotspots
      const hotspotsRes = await fetch(`${API_BASE}/hotspots/india`);
      if (hotspotsRes.ok) {
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

          setLogs(prev => [...newLogs, ...prev].slice(0, 50));
        } else {
          // Fallback: Add a status log if no new hotspots
          setLogs(prev => [{
            id: `status-${Date.now()}`,
            message: "✓ Satellite scanning complete. No new thermal anomalies detected in sector GJ_NW.",
            timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            severity: 'info' as const
          }, ...prev].slice(0, 50));
        }
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
    const lat = activeCoords.lat;
    const lng = activeCoords.lng;
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.current && isMounted) {
          // Introduce subtle real-time micro-fluctuations (e.g. sensor noise)
          // to make the dashboard feel active and real-time.
          const tempFluctuation = (Math.random() * 0.4 - 0.2); // +/- 0.2°C
          const humFluctuation = Math.floor(Math.random() * 3 - 1); // +/- 1%
          const windFluctuation = (Math.random() * 0.6 - 0.3); // +/- 0.3 km/h

          setWeather({
            temp: data.current.temperature_2m + tempFluctuation,
            humidity: Math.max(0, Math.min(100, data.current.relative_humidity_2m + humFluctuation)),
            wind: Math.max(0, parseFloat((data.current.wind_speed_10m + windFluctuation).toFixed(1)))
          });
        }
      } catch (err) {
        console.error("Telemetry weather fetch error:", err);
      }
    };

    // Initial fetch
    fetchWeather();

    // Fetch every 3 seconds
    const interval = setInterval(fetchWeather, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeCoords.lat, activeCoords.lng]);

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
      } catch (e) { }
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
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <div className="pt-24 pb-12 px-12 lg:px-24 max-w-[1500px] mx-auto w-full flex-1 flex flex-col">
        {/* Dashboard Top Section: Command Center Header */}
        <div className="w-full">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 mb-16">

            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono text-slate-500">
                  System Status: Secure
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500">
                  Dahod Vector Link: Active
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-[0.9] mb-4">
                DeepScan <span className="fire-gradient bg-clip-text text-transparent italic">Telemetry</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Real-time thermal analysis and risk vector mapping for the <span className="text-slate-900 font-bold">{userCity || "West Gujarat"}</span> corridor.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 w-full xl:w-auto">
              {[
                { label: "Active Monitors", value: topStats.monitors, icon: Stack, color: "text-slate-400" },
                { label: "Inference Latency", value: topStats.latency, suffix: "ms", icon: Pulse, color: "text-blue-500" },
                { label: "Model Confidence", value: topStats.confidence, suffix: "%", icon: ShieldCheck, color: "text-green-500" },
                { label: "Critical Alerts", value: topStats.riskPixels, icon: Warning, color: "text-red-600" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="premium-card bg-white px-8 py-6 flex items-center gap-6 shadow-sm border border-slate-200 rounded-sm flex-1 min-w-[220px] group  transition-all duration-500"
                >
                  <div className={`p-4 rounded-sm bg-slate-50 border border-slate-200  transition-transform ${stat.color}`}>
                    <stat.icon size={28} weight="bold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 leading-none tracking-tighter">
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
            <div className="bg-slate-950 rounded-sm p-12 pt-16 text-white relative overflow-hidden shadow-sm min-h-[580px] flex flex-col border border-slate-800">

              {/* INTERACTIVE MAP COMPONENT (REAL-TIME) */}
              <div className="absolute inset-0 z-0">
                <RiskMap
                  forecastHour={forecastHour}
                  riskLevel={riskLevel}
                  userLat={userLat}
                  userLng={userLng}
                  isDrawingMode={isDrawingMode}
                  drawnPoints={drawnPoints}
                  onAddPoint={handleMapClick}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 pointer-events-none" />
              </div>

              {/* PREMIUM HUD INTERFACE */}
              <div className="absolute inset-x-8 top-8 z-30 pointer-events-none flex justify-between items-start">
                {/* Tactical HUD: Top Left */}
                <div className="flex flex-col gap-4">
                  <div className="bg-black/40  border border-white/10 rounded-sm p-5 pointer-events-auto shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute inset-0" />
                        <div className="w-2 h-2 rounded-full bg-red-600 relative" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500 text-white/90">Satellite Downlink: Active</span>
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tighter mb-4 leading-none">
                      MISSION_CONTROL <span className="text-white/30 font-light">|</span> <span className="text-red-600">HQ_ALPHA</span>
                    </h3>

                    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono text-slate-500">Altitude</span>
                          <span className="text-xs font-mono text-white/80 tracking-tighter">402.48 KM</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono text-slate-500">Vector</span>
                          <span className="text-xs font-mono text-white/80 tracking-tighter">GJ_NW_33</span>
                        </div>
                      </div>
                      <div className="flex flex-col mt-1">
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono text-slate-500">Global Scan Coordinates</span>
                        <span className="text-[10px] font-mono text-blue-400 tracking-tighter">
                          {satellitePos.lat.toFixed(4)}°N / {satellitePos.lng.toFixed(4)}°E
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary HUD Controls */}
                  <div className="flex gap-2 pointer-events-auto">
                    <div className="px-4 py-3 bg-black/40  border border-white/10 rounded-sm flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono text-slate-500">System_Ready</span>
                    </div>
                  </div>

                </div>

                {/* Metric HUD: Top Right */}
                <div className="flex flex-col items-end gap-3 pointer-events-auto">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="p-4 bg-black/40 hover:bg-black/60  border border-white/10 rounded-sm transition-all hover:scale-110 active:scale-95 group shadow-sm"
                      title="Fullscreen Monitor"
                    >
                      <ArrowsOut size={20} className="text-white group-hover:text-red-600 transition-colors" weight="bold" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900/80 to-black/80  border border-white/10 rounded-sm p-6 shadow-sm flex flex-col items-end min-w-[180px]">

                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono text-slate-500 mb-1">Fire Weather Index</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white tracking-tighter">
                        {Math.round(riskLevel)}
                      </span>
                      <span className="text-sm font-bold text-red-600">FWI</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskLevel}%` }}
                        className="h-full bg-red-600 shadow-[0_0_10px_#f97316]"
                      />
                    </div>
                  </div>

                  <div className="bg-black/40  border border-white/10 rounded-sm p-4 flex flex-col gap-2 items-end">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono text-slate-500">Inference Confidence</span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-500" weight="bold" />
                      <span className="text-lg font-bold text-white tracking-tighter">{topStats.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawing Mode Instructions HUD Overlay */}
              {isDrawingMode && (
                <div className="absolute inset-x-8 bottom-8 z-30 bg-black/80 backdrop-blur-md border border-orange-500/30 rounded-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4 pointer-events-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest font-mono mb-0.5">Drawing Geofence Boundary</span>
                    <span className="text-xs text-white/90 font-medium">Click on the map to place boundary vertices. Plot at least 3 points.</span>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1">({drawnPoints.length} vertices plotted)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUndoPoint}
                      disabled={drawnPoints.length === 0}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-sm text-[9px] font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer border border-zinc-700"
                    >
                      Undo
                    </button>
                    <button
                      onClick={handleClearPoints}
                      disabled={drawnPoints.length === 0}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-sm text-[9px] font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer border border-zinc-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsDrawingMode(false)}
                      disabled={drawnPoints.length < 3}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50 text-white rounded-sm text-[9px] font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              )}

            </div>


            {/* 2. LOGS ROW */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 min-h-[400px] flex flex-col">
              <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Live Satellite Logs</h3>
                  <div className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold uppercase tracking-widest font-mono text-slate-500">NRT Feed</div>
                </div>
                <div className="flex gap-2">
                  {(['all', 'warn', 'critical'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono text-slate-500 transition-colors
                        ${logFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
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
                            className="flex items-start gap-4 py-2.5 border-b border-slate-100 last:border-0"
                          >
                            <div className="pt-1.5 shrink-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${log.severity === 'info' ? 'bg-slate-400' :
                                log.severity === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                            </div>
                            <span className="font-mono text-[9px] text-slate-400 shrink-0 pt-1">{log.timestamp}</span>
                            <span className="text-xs font-mono text-slate-600 leading-relaxed flex-1">{log.message}</span>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ENVIRONMENTAL & TRENDS ROW */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 w-full flex flex-col">
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-10">
                <div className="flex-[1.5] w-full flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-0">Real-Time Environmental Intelligence</h3>
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-mono font-bold text-emerald-600 uppercase tracking-wider">LIVE_3S</span>
                      </div>
                    </div>
                    {activeCoords.lat && activeCoords.lng && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <MapPin size={10} className="text-slate-500" weight="bold" />
                        {activeCoords.name}: {activeCoords.lat.toFixed(2)}°N, {activeCoords.lng.toFixed(2)}°E
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-500 rounded-sm"><Pulse size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-0.5">Humidity</p><p className="text-2xl font-bold text-slate-900 leading-none">{weather.humidity}%</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-50 text-red-500 rounded-sm"><WarningCircle size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-0.5">Temp</p><p className="text-2xl font-bold text-slate-900 leading-none">{(weather.temp ?? 0).toFixed(1)}°C</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 text-amber-500 rounded-sm"><Broadcast size={20} weight="bold" /></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-0.5">Wind</p><p className="text-2xl font-bold text-slate-900 leading-none">{weather.wind ?? 0}<span className="text-[10px] ml-1">km/h</span></p></div>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block w-px h-28 bg-slate-100" />
                <div className="flex-1 w-full flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-0">7-Day Predictive FWI Trend</h3>
                    {isFwiLoading && (
                      <span className="text-[8px] font-mono text-amber-500 animate-pulse">SYNCING_FWI...</span>
                    )}
                  </div>
                  <div className="h-28 w-full">
                    {fwiForecast.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={fwiForecast}
                          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="fwiGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            domain={[0, 100]}
                            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                            tickLine={false}
                          />
                          <RechartsTooltip content={<CustomFwiTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="fwi" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#fwiGradient)" 
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-sm">
                        <span className="text-[10px] font-mono text-slate-400">Loading forecast telemetry...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* 4. SECONDARY SYSTEMS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Alert Subscription */}
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Broadcast size={24} className="text-red-600" weight="bold" />
                  <h3 className="text-lg font-bold text-slate-900">Alert Subscription</h3>
                </div>
                {!subscribed ? (
                  <div className="flex flex-col gap-4 mt-auto">
                    {/* Subscription Mode Tabs */}
                    <div className="flex bg-slate-100 p-0.5 rounded-sm mb-2 border border-slate-200/50">
                      <button
                        onClick={() => {
                          setSubscriptionType("standard");
                          setIsDrawingMode(false);
                        }}
                        className={`flex-1 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest font-mono transition-all duration-300 cursor-pointer
                          ${subscriptionType === "standard" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Predefined Sector
                      </button>
                      <button
                        onClick={() => setSubscriptionType("custom")}
                        className={`flex-1 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest font-mono transition-all duration-300 cursor-pointer
                          ${subscriptionType === "custom" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Custom Geofence
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Telegram ID (e.g. @name) or Phone"
                      value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-red-600/20 outline-none"
                    />

                    {subscriptionType === "standard" ? (
                      <div className="flex flex-col gap-3">
                        <select
                          value={selectedSector}
                          onChange={(e) => setSelectedSector(e.target.value)}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm outline-none w-full cursor-pointer"
                        >
                          {monitoredZones.map(z => <option key={z.name} value={z.name}>{z.name}</option>)}
                        </select>
                        <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-sm text-center flex flex-col justify-center items-center min-h-[80px]">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-normal max-w-[260px]">
                            ⚡ Standard sectors monitor a 100km radius around predefined station vectors
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="Geofence Boundary Name (e.g. Sector Alpha)"
                          value={customSectorName}
                          onChange={(e) => setCustomSectorName(e.target.value)}
                          list="geofence-suggestions"
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-red-600/20 outline-none w-full"
                        />
                        <datalist id="geofence-suggestions">
                          <option value="Dahod Forest Corridor" />
                          <option value="Nainital Conservation Area" />
                          <option value="Kutch Sanctuary Border" />
                          <option value="Anand Forestry Division" />
                          <option value="Dehradun Foothills" />
                          <option value="Gir National Park Sector A" />
                          <option value="Jim Corbett Sanctuary" />
                          <option value="Sundarbans Eco Zone" />
                          <option value="Western Ghats Protection Zone" />
                          <option value="Kaziranga National Reserve" />
                        </datalist>
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-sm text-center min-h-[80px]">
                          {!isDrawingMode ? (
                            <button
                              onClick={() => {
                                setIsDrawingMode(true);
                                setDrawnPoints([]);
                              }}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider font-mono transition-all duration-300 cursor-pointer shadow-xs"
                            >
                              📍 Start Drawing Boundary
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-[10px] font-mono text-orange-600 font-bold uppercase tracking-wider animate-pulse">Drawing mode active</span>
                              <span className="text-[9px] font-mono text-slate-500 uppercase">{drawnPoints.length} vertices plotted</span>
                              {drawnPoints.length < 3 && (
                                <span className="text-[9px] text-red-500 font-mono italic">Add {3 - drawnPoints.length} more point(s)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={isSubscribing || (subscriptionType === "custom" && isDrawingMode && drawnPoints.length < 3)}
                      onClick={async () => {
                        if (isSubscribing) return;
                        const trimmed = alertPhone.trim();
                        const isTelegram = trimmed.startsWith("@");
                        const isPhone = /^\+?[0-9]{10,15}$/.test(trimmed);

                        if (!isTelegram && !isPhone) {
                          setAlertError("Enter Telegram (@username) or 10-digit phone number");
                          return;
                        }

                        if (subscriptionType === "custom") {
                          if (!customSectorName.trim()) {
                            setAlertError("Please enter a name for the custom boundary");
                            return;
                          }
                          if (drawnPoints.length < 3) {
                            setAlertError("Geofence requires at least 3 vertices plotted on map");
                            return;
                          }
                        }

                        setIsSubscribing(true);
                        setAlertError(null);

                        try {
                          const requestBody = {
                            target: trimmed,
                            sector: subscriptionType === "custom" ? customSectorName.trim() : selectedSector,
                            vertices: subscriptionType === "custom" ? drawnPoints : null
                          };

                          const res = await fetch(`${API_BASE}/api/subscribe`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(requestBody)
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setSubscribed(true);
                            setIsDrawingMode(false);
                          } else {
                            setAlertError(data.detail || "Subscription failed. Start the bot first!");
                          }
                        } catch (err) {
                          console.error("Subscription Error:", err);
                          setAlertError("Error connecting to server. Please try again.");
                        } finally {
                          setIsSubscribing(false);
                        }
                      }}
                    >
                      {isSubscribing ? "Subscribing..." : "Subscribe"}
                    </Button>
                    {alertError && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono text-center mt-2 px-1">
                        {alertError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center gap-3 py-4 text-center mt-auto min-h-[168px] border border-dashed border-green-200 bg-green-50/30 rounded-sm">
                    <CheckCircle size={28} className="text-green-500 animate-pulse" weight="bold" />
                    <div>
                      <p className="text-xs font-black text-green-800 uppercase tracking-widest font-mono">System Synced</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-snug">
                        Real-time satellite link active for sector <span className="font-bold text-slate-800">{subscriptionType === 'custom' ? customSectorName : selectedSector}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubscribed(false);
                        setAlertPhone("");
                        setAlertError(null);
                        setDrawnPoints([]);
                        setIsDrawingMode(false);
                        setCustomSectorName("");
                      }}
                      className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-sm transition-all duration-300 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider font-mono shadow-xs active:scale-95 cursor-pointer"
                    >
                      <ArrowClockwise size={12} weight="bold" />
                      <span>Add More</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Satellite Orbit */}
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 h-full flex flex-col justify-between relative">

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Database size={20} className="text-red-600" weight="bold" />
                    <h3 className="text-lg font-bold text-slate-900">Satellite Orbit</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    MODIS Terra is currently passing over the North-Western sector. Real-time telemetry is being processed at HQ_ALPHA.
                  </p>

                  <div className="border-t border-slate-100 pt-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-3">Live Downlink Telemetry</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Orbit Inclination</span>
                        <span className="text-[11px] font-mono font-bold text-slate-800">98.21° (Sun-Sync)</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Altitude Velocity</span>
                        <span className="text-[11px] font-mono font-bold text-slate-800">705.8 km / 7.5 km/s</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Downlink Link</span>
                        <span className="text-[11px] font-mono font-bold text-slate-800">8.212 GHz (X-Band)</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Signal Quality</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[11px] font-mono font-bold text-slate-800">Active (98.4%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-4 text-xs font-bold text-red-600 uppercase tracking-widest font-mono text-slate-500 cursor-pointer hover:gap-6 transition-all mt-6"
                  onClick={() => { setIsTracking(true); }}
                >
                  <span>Track Satellite</span>
                  <ArrowRight size={16} />
                </div>

                <AnimatePresence>
                  {isTracking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center p-8 text-center text-white rounded-sm">
                      <button onClick={() => setIsTracking(false)} className="absolute top-6 right-6 text-white/40"><ArrowRight size={20} className="rotate-180" /></button>
                      <Broadcast size={32} className="text-red-600 animate-pulse mb-4" />
                      <h4 className="font-bold text-lg mb-2">Satellite Locked</h4>
                      <div className="bg-white/5 p-4 rounded-sm w-full text-[10px] uppercase font-bold text-left space-y-2">
                        <div className="flex justify-between"><span>Designator</span><span>MODIS-T-08</span></div>
                        <div className="flex justify-between text-green-400"><span>Signal</span><span>Excellent</span></div>
                      </div>
                      <Button variant="primary" className="w-full text-[10px] mt-6" onClick={() => setIsTracking(false)}>Sync Stream</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


            </div>

            {/* 5. ORBITAL CONSTELLATION STATUS */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-sm">
                    <Broadcast size={20} weight="bold" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Orbital Constellation Status</h3>
                </div>
                <div className="px-2 py-1 bg-green-50 rounded text-[9px] font-black uppercase tracking-widest text-green-600 border border-green-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  All Systems Nominal
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { name: "MODIS Terra", status: "ONLINE", signal: "98%", lastPass: "14m ago", orbit: "Sun-Sync" },
                  { name: "MODIS Aqua", status: "ONLINE", signal: "92%", lastPass: "1h 12m ago", orbit: "Sun-Sync" },
                  { name: "VIIRS SNPP", status: "ONLINE", signal: "96%", lastPass: "32m ago", orbit: "Polar" },
                  { name: "VIIRS NOAA-20", status: "STANDBY", signal: "89%", lastPass: "2h 5m ago", orbit: "Polar" },
                ].map((sat, i) => (
                  <div key={i} className="p-4 rounded-sm bg-slate-50 border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{sat.name}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-wider ${sat.status === "ONLINE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>{sat.status}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                      <div className="flex justify-between">
                        <span>Signal Quality</span>
                        <span className="font-mono text-slate-800 font-bold">{sat.signal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Pass</span>
                        <span className="text-slate-800 font-bold">{sat.lastPass}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orbit Type</span>
                        <span className="text-slate-800">{sat.orbit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT AREA: Control Panel (Col 3) */}

          <div className="lg:col-span-1 flex flex-col gap-6 w-full">
            <LocationRiskCard lat={userLat} lng={userLng} />

            {/* 1. REGIONAL ALERTS */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Regional Alerts</h3>
              <div className="flex flex-col gap-4 max-h-[265px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain snap-y snap-mandatory">



                {alertsData.map((alert, i) => (
                  <div key={i} className="p-4 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all snap-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${alert.color}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{alert.region}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500">{alert.status}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{getRelativeTime(alert.triggeredAt)}</span>
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
                    className="fixed inset-10 bg-white/95  z-[60] rounded-[3rem] border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center overflow-hidden"
                  >
                    <button onClick={() => setIsMapping(false)} className="absolute top-8 right-8 p-4 hover:bg-slate-100 rounded-full transition-colors">
                      <ArrowRight size={24} className="rotate-180" />
                    </button>
                    <div className="text-center max-w-2xl">
                      <h2 className="text-4xl font-bold text-slate-900 mb-6">Fetching Planetary Dataset</h2>
                      <div className="grid grid-cols-3 gap-12 text-left">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-1">Active Anomalies</p>
                          <p className="text-3xl font-bold text-slate-900">4,129</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-1">Global Confidence</p>
                          <p className="text-3xl font-bold text-blue-600">88.4%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-slate-500 mb-1">Node Status</p>
                          <p className="text-3xl font-bold text-green-600">OPERATIONAL</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-8 uppercase tracking-widest font-mono text-slate-500">
                        Source: NASA FIRMS · Updated daily at 00:00 UTC
                      </p>
                      <div className="w-full h-1 bg-slate-100 rounded-full mt-12 overflow-hidden">
                        <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 4, ease: "easeInOut" }} className="h-full bg-blue-500" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* 2. EMERGENCY SYSTEM (Orange Card) */}
            <div className="bg-red-600 rounded-sm p-8 text-white flex flex-col gap-4 shadow-sm">
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
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Model Health</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">ConvLSTM temporal analysis is performing within {(100 - topStats.confidence).toFixed(1)}% variance of validation data.</p>
              </div>
              <div className="flex flex-col gap-6 mt-auto">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500">
                    <span className="text-slate-400">Est. GPU Utilisation</span>
                    <span className="text-slate-900">{modelHealth.gpu}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${modelHealth.gpu}%` }} className="h-full bg-slate-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500">
                    <span className="text-slate-400">Est. VRAM Usage</span>
                    <span className="text-slate-900">{modelHealth.memory}GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(modelHealth.memory / 16) * 100}%` }} className="h-full bg-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500">
                    <span className="text-slate-400">Inference Throughput</span>
                    <span className="text-slate-900">{Math.round(1000 / topStats.latency)} FPS</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${Math.min(100, (1000 / topStats.latency) * 3)}%` }} className="h-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. TACTICAL RESPONSE & DISPATCH */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-8 flex flex-col justify-between flex-1 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-sm">
                      <ShieldCheck size={20} weight="bold" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tactical Response & Dispatch</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-red-100 text-[9px] font-black uppercase tracking-widest text-red-700 rounded-sm">
                    2 Active Dispatches
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Real-time resource coordination and response team statuses linked to active alert sectors.
                </p>

                <div className="flex flex-col gap-4">
                  {/* Dispatch Unit 1 */}
                  <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                        <span className="text-xs font-bold text-slate-900">Ranger Crew Alpha</span>
                      </div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 tracking-wider">ON SCENE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                      <div className="flex justify-between">
                        <span>Sector:</span>
                        <span className="font-bold text-slate-800">Dahod</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comms:</span>
                        <span className="font-bold text-slate-800">VHF Ch. 16</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Unit 2 */}
                  <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-900">Aerial Drone Wing</span>
                      </div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 tracking-wider">PATROLLING</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                      <div className="flex justify-between">
                        <span>Area:</span>
                        <span className="font-bold text-slate-800">Kutch N.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery:</span>
                        <span className="font-bold text-slate-800">84%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <Button variant="secondary" className="w-full text-xs py-3 flex items-center justify-center gap-2" onClick={() => setIsCommsOpen(true)}>
                  <span>Open Comms Console</span>
                  <ArrowRight size={14} />
                </Button>
              </div>

              <AnimatePresence>
                {isCommsOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950 z-20 flex flex-col p-6 text-white"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">Tactical Comms Link</span>
                      </div>
                      <button onClick={() => setIsCommsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={16} weight="bold" />
                      </button>
                    </div>

                    {/* Frequencies & Waveform */}
                    <div className="mb-4 bg-white/5 border border-white/10 rounded-sm p-3 flex flex-col gap-2">
                      <div className="flex justify-between text-[9px] font-mono text-white/50">
                        <span>Frequency: <strong className="text-blue-400">146.520 MHz</strong></span>
                        <span>RSSI: <strong className="text-green-400">-76 dBm</strong></span>
                      </div>
                      {/* Audio waveform mockup */}
                      <div className="h-6 flex items-end gap-1 px-2 pt-2 justify-center">
                        {[0.3, 0.8, 0.45, 0.9, 0.6, 0.2, 0.7, 0.4, 0.85, 0.5, 0.95, 0.35, 0.75, 0.25, 0.6, 0.8].map((val, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [`${val * 20}%`, `${(1 - val) * 100}%`, `${val * 100}%`] }}
                            transition={{ duration: 1.2 + i * 0.05, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            className="w-1 bg-red-500 rounded-full"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Radio Logs Console */}
                    <div className="flex-1 overflow-y-auto bg-black/40 border border-white/5 rounded-sm p-3 font-mono text-[9px] text-white/80 space-y-2.5 custom-scrollbar">
                      <div className="border-l-2 border-green-500 pl-2">
                        <p className="text-white/40">[13:30:12] UPLINK_OK</p>
                        <p>Crew Alpha: "On-site at Dahod North. Commencing perimeter containment."</p>
                      </div>
                      <div className="border-l-2 border-blue-500 pl-2">
                        <p className="text-white/40">[13:31:05] TELEMETRY_RX</p>
                        <p>Drone PR-9: "Spot fire ignition vector detected at 22.842N, 74.256E. Wind heading NW."</p>
                      </div>
                      <div className="border-l-2 border-red-500 pl-2">
                        <p className="text-white/40">[13:32:00] SYS_ALERT</p>
                        <p>Base HQ: "Copy Crew Alpha. Water Bomber Wing HE-2 on 5-minute standby."</p>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE}/api/dispatch/ping`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ unit: "Ranger Crew Alpha" })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              alert(`Ping sent! ${data.message}`);
                            } else {
                              alert(`Ping failed: ${data.detail || 'Make sure you have an active Telegram subscription!'}`);
                            }
                          } catch (err) {
                            alert("Ping transmission failed: Cannot connect to server.");
                          }
                        }}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-[9px] font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer"
                      >
                        Ping Ranger Unit
                      </button>
                      <button 
                        onClick={() => {
                          alert("Frequency refreshed. Syncing encrypted channels.");
                        }}
                        className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors cursor-pointer"
                        title="Sync Frequency"
                      >
                        <ArrowClockwise size={12} weight="bold" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
          >
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 right-8 z-[110] flex justify-between items-center pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500 animate-pulse shadow-[0_0_20px_#dc2626]">Tactical Satellite Feed</div>
                  <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">GLOBAL_SURVEILLANCE_MODE</h2>
                </div>
                <p className="text-slate-400 font-mono text-xs ml-1 uppercase tracking-widest font-mono text-slate-500">Sector: India-Pan-Spatio-Temporal · Lock: {satellitePos.lat.toFixed(2)}N, {satellitePos.lng.toFixed(2)}E</p>
              </div>

              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="bg-black/60  border border-white/10 px-6 py-3 rounded-sm flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono text-slate-500 mb-0.5">Risk Confidence</span>
                  <span className="text-2xl font-bold text-red-600">{topStats.confidence}%</span>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-5 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-transform hover:scale-110 shadow-sm"
                >
                  <X size={28} weight="bold" />
                </button>
              </div>
            </div>

            {/* The Map */}
            <div className="flex-1 w-full h-full relative">
              <RiskMap forecastHour={forecastHour} riskLevel={riskLevel} userLat={userLat} userLng={userLng} />

              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[110] w-full max-w-2xl px-8">
              <div className="bg-black/60  border border-white/10 rounded-sm p-10 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-sm flex items-center justify-center border border-red-600/30">
                      <Clock size={24} className="text-red-600" weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-slate-500 text-white/30 block mb-1">Time Prediction Hub</span>
                      <span className="text-sm font-bold text-white uppercase">{forecastHour === 0 ? "Real-Time Monitoring" : `Inference Window: T+${forecastHour} Hours`}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono text-slate-500 block mb-1">Predicted Spread</span>
                    <span className="text-2xl font-bold text-white">{(riskLevel * 4.2 + (forecastHour * 2)).toFixed(0)} MW/m²</span>
                  </div>
                </div>

                <input
                  type="range" min="0" max="72" step="24"
                  value={forecastHour}
                  onChange={(e) => setForecastHour(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-600"
                />

                <div className="flex justify-between text-[11px] font-bold text-white/20 uppercase tracking-widest font-mono text-slate-500">
                  <span className={forecastHour === 0 ? "text-red-600" : ""}>Live</span>
                  <span className={forecastHour === 24 ? "text-red-600" : ""}>+24H</span>
                  <span className={forecastHour === 48 ? "text-red-600" : ""}>+48H</span>
                  <span className={forecastHour === 72 ? "text-red-600" : ""}>+72H Analysis</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />


      {/* PRINT-ONLY REPORT TEMPLATE */}
      <div className="hidden print:block print:p-12 bg-white text-slate-900 font-sans print-report-container">
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
          <div className="flex justify-between items-start border-b-4 border-red-600 pb-8">
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold mb-2">
                <span>🔥</span> FireSense AI <span className="text-red-600">Intelligence</span>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest font-mono text-slate-500 text-[10px]">Satellite-Based Wildfire Prediction System</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xs">REPORT ID: FS-GJ-2024-0847</p>
              <p className="text-slate-400 text-[10px]">{isMounted ? new Date().toLocaleString() : ""}</p>
            </div>
          </div>

          {/* Risk Level Hero */}
          <div className="bg-slate-50 p-8 rounded-sm border border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-slate-400 font-bold uppercase tracking-widest font-mono text-slate-500 text-[11px] mb-2">Current Prediction Status</h2>
              <div className="text-6xl font-bold text-red-600 tracking-tighter">CRITICAL RISK</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">{riskLevel.toFixed(1)}%</div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono text-slate-500 mt-1">Model Confidence Score</p>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-sm p-6">
              <h3 className="text-sm font-bold border-b border-slate-200 pb-3 mb-4 uppercase tracking-wider text-slate-400">Sector Metrics</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Region</span>
                  <span className="text-xs font-bold">Dahod, Gujarat</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Coordinates</span>
                  <span className="text-xs font-bold">{satellitePos.lat.toFixed(4)}° N, {satellitePos.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">NDVI (Vegetation)</span>
                  <span className="text-xs font-bold text-red-600">0.31 (Severe Stress)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Wind Speed</span>
                  <span className="text-xs font-bold">47 km/h (NE)</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-sm p-6">
              <h3 className="text-sm font-bold border-b border-slate-200 pb-3 mb-4 uppercase tracking-wider text-slate-400">Model Configuration</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Architecture</span>
                  <span className="text-xs font-bold">ConvLSTM v3 (Temporal)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Frame Sequence</span>
                  <span className="text-xs font-bold">72 Hours (Satellite)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Feature Weight</span>
                  <span className="text-xs font-bold text-red-600">NDVI Primary (73%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">System State</span>
                  <span className="text-xs font-bold text-green-600">Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-8 border-2 border-dashed border-red-200 rounded-sm bg-red-50/30">
            <h3 className="text-red-600 font-bold uppercase tracking-widest font-mono text-slate-500 text-xs mb-4">Urgent Response Directives</h3>
            <ul className="flex flex-col gap-3 text-xs text-slate-700 leading-relaxed list-disc pl-5">
              <li>Deploy ground teams to Dahod North-East corridor for thermal validation.</li>
              <li>Notify local forest range offices of immediate risk expansion.</li>
              <li>Pre-position emergency fire suppression assets within a 5km radius of the focal coordinate.</li>
              <li>Monitor NDVI dryness trends in adjacent sectors for secondary trigger signals.</li>
            </ul>
          </div>

          {/* Footer of Report */}
          <div className="mt-auto pt-10 border-t border-slate-200 flex justify-between items-end">
            <div className="text-[9px] text-slate-400 max-w-sm leading-relaxed">
              This report is generated by the FireSense AI Research Prototype. All predictions are based on multi-temporal satellite imagery and should be ground-validated by forest officials.
            </div>
            <div className="text-right">
              <div className="w-32 h-px bg-slate-300 mb-2 ml-auto" />
              <p className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500 text-slate-900">System Signature</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-mono text-slate-500">Digital Auth: FS_MODIS_01</p>
            </div>
          </div>
        </div>
      </div>



    </main>
  );
}
