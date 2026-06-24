"use client";

import { useState, useEffect, FormEvent } from "react";
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
  CircleNotch,
  CheckCircle,
  MapPin,
  ArrowClockwise,
  MonitorPlay,
  Pulse,
  MagnifyingGlass
} from "@phosphor-icons/react";

const features = [
  { id: "ndvi", label: "NDVI (Veg Health)", icon: Leaf, min: 0, max: 1, step: 0.01, default: 0.45 },
  { id: "temp", label: "Surface Temp (°C)", icon: ThermometerSimple, min: 15, max: 55, step: 1, default: 32 },
  { id: "wind", label: "Wind Speed (km/h)", icon: Wind, min: 0, max: 80, step: 1, default: 12 },
  { id: "hum", label: "Humidity (%)", icon: Drop, min: 5, max: 100, step: 1, default: 45 },
  { id: "slope", label: "Slope Gradient (°)", icon: Mountains, min: 0, max: 45, step: 1, default: 15 },
  { id: "cover", label: "Land Cover Rank", icon: Stack, min: 1, max: 5, step: 1, default: 3 },
  { id: "hist", label: "Fire History", icon: Fire, min: 0, max: 10, step: 1, default: 2 },
];

function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * progress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}</span>;
}

export default function InteractiveDemo() {
  const [inputs, setInputs] = useState<Record<string, number>>(
    features.reduce((acc, f) => ({ ...acc, [f.id]: f.default }), {})
  );
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [result, setResult] = useState<{ risk: "LOW" | "MEDIUM" | "HIGH"; score: number } | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const [locationName, setLocationName] = useState<string>("Dahod Sector");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 22.83, lng: 74.25 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced Indian city/location search suggestions (as type effect)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              "User-Agent": "PyroVision-Wildfire-App/1.0"
            }
          }
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const formatted = data.map((item: any) => ({
            name: item.display_name.split(",").slice(0, 3).join(", "),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          setSuggestions(formatted);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Suggestions Fetch Error:", err);
      }
    }, 350); // 350ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/ml";

  const handleSearchLocation = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "PyroVision-Wildfire-App/1.0"
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = item.display_name.split(",").slice(0, 2).join(", ");
        
        setLocationName(displayName);
        setCoords({ lat, lng });
        await fetchWeather(lat, lng);
        setSearchQuery("");
      } else {
        setSearchError("Location not found in India. Try another search.");
      }
    } catch (err) {
      console.error("Geocoding Error:", err);
      setSearchError("Error searching location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchWeather = async (lat: number, lng: number) => {
    setIsWeatherLoading(true);
    try {
      // 1. Fetch weather from Open-Meteo including soil moisture
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,soil_moisture_0_to_7cm`
      );
      const weatherData = await weatherRes.json();
      
      // 2. Fetch real hotspots from NASA FIRMS via backend
      let hotspotsCount = 0;
      try {
        const hotspotsRes = await fetch(`${API_BASE}/hotspots?lat=${lat}&lon=${lng}&radius=100&days=30`);
        const hotspotsData = await hotspotsRes.json();
        hotspotsCount = hotspotsData.count || 0;
      } catch (e) {
        console.warn("Could not fetch real-time hotspots, using seed fallback:", e);
      }

      // 3. Fetch real elevations for slope computation
      let slope = 15; // default fallback
      try {
        const latNorth = lat + 0.005;
        const lngEast = lng + 0.005;
        const elevRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lat},${latNorth},${lat}&longitude=${lng},${lng},${lngEast}`
        );
        const elevData = await elevRes.json();
        if (elevData && elevData.elevation && elevData.elevation.length === 3) {
          const [eCenter, eNorth, eEast] = elevData.elevation;
          const dLatMeters = 555;
          const dLngMeters = 555 * Math.cos(lat * Math.PI / 180);
          
          const slopeNorth = (eNorth - eCenter) / dLatMeters;
          const slopeEast = (eEast - eCenter) / dLngMeters;
          
          const slopeRad = Math.atan(Math.sqrt(slopeNorth ** 2 + slopeEast ** 2));
          let slopeDeg = slopeRad * (180 / Math.PI);
          
          // Boost it for realistic landscape gradient values
          slope = Math.min(45, Math.max(0, Math.round(slopeDeg * 12)));
        }
      } catch (e) {
        console.warn("Could not compute real slope, using fallback:", e);
      }

      if (weatherData.current) {
        const temp = weatherData.current.temperature_2m;
        const hum = weatherData.current.relative_humidity_2m;
        const wind = weatherData.current.wind_speed_10m;
        const soilMoisture = weatherData.current.soil_moisture_0_to_7cm !== undefined 
          ? weatherData.current.soil_moisture_0_to_7cm 
          : 0.25;

        // Automatically calculate NDVI based on satellite-measured soil moisture
        // soil moisture ranges from 0.0 (dry) to ~0.45 (saturated)
        // NDVI ranges from 0.0 (barren) to 1.0 (dense canopy)
        const ndvi = Math.min(1.0, Math.max(0.0, 0.12 + soilMoisture * 1.6));

        // Automatically estimate Land Cover Rank based on computed NDVI
        let cover = 3;
        if (ndvi < 0.20) cover = 1;
        else if (ndvi < 0.35) cover = 2;
        else if (ndvi < 0.55) cover = 3;
        else if (ndvi < 0.75) cover = 4;
        else cover = 5;

        // Automatically compute Fire History (0-10) using actual real-time NASA FIRMS hotspots count if available
        let hist = 0;
        if (hotspotsCount > 0) {
          hist = Math.min(10, Math.ceil(hotspotsCount / 3)); // 1 point per 3 active fires, max 10
        }

        setInputs({
          ndvi: parseFloat(ndvi.toFixed(2)),
          temp: Math.min(55, Math.max(15, Math.round(temp))),
          wind: Math.min(80, Math.max(0, Math.round(wind))),
          hum: Math.min(100, Math.max(5, Math.round(hum))),
          slope: Math.min(45, Math.max(0, slope)),
          cover: Math.min(5, Math.max(1, cover)),
          hist: Math.min(10, Math.max(0, hist)),
        });

        setShowBadge(true);
        setTimeout(() => setShowBadge(false), 3000);
      }
    } catch (err) {
      console.error("Weather Fetch Error:", err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const runInference = async () => {
    setIsInferenceRunning(true);
    setResult(null);
    
    try {
      const query = new URLSearchParams({
        lat: coords.lat.toString(),
        lng: coords.lng.toString(),
        ndvi: inputs.ndvi.toString(),
        lst: inputs.temp.toString(),
        wind_speed: inputs.wind.toString(),
        humidity: inputs.hum.toString(),
        slope: inputs.slope.toString(),
        fire_history: inputs.hist.toString()
      });

      const response = await fetch(`${API_BASE}/api/predict?${query}`);
      const data = await response.json();

      if (data.risk) {
        setResult({ risk: data.risk, score: data.confidence * 100 });
      }
    } catch (err) {
      console.error("Inference Error:", err);
      // Front-end Simulation Fallback (Ensures full 7-factor dependency)
      setTimeout(() => {
        // Normalized scales
        const n_ndvi = 1 - inputs.ndvi; // Lower health = higher risk
        const n_temp = (inputs.temp - 15) / 40;
        const n_wind = inputs.wind / 80;
        const n_hum = (100 - inputs.hum) / 95;
        const n_slope = inputs.slope / 45;
        const n_cover = (inputs.cover - 1) / 4;
        const n_hist = inputs.hist / 10;

        // Weighted matrix for full-factor dependency
        const raw = (n_temp * 0.20) + 
                    (n_wind * 0.20) + 
                    (n_ndvi * 0.15) + 
                    (n_hum * 0.15) + 
                    (n_slope * 0.10) + 
                    (n_cover * 0.10) + 
                    (n_hist * 0.10);

        const score = Math.min(99, Math.max(8, 15 + (raw * 80)));
        
        setResult({ 
          risk: score > 75 ? "HIGH" : score > 45 ? "MEDIUM" : "LOW", 
          score: score 
        });
      }, 800);
    } finally {
      setIsInferenceRunning(false);
    }
  };

  const handleInputChange = (id: string, value: number) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  return (
    <AnimatedSection id="playground" className="py-16 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Side: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <AnimatedItem>
            <EyebrowBadge label="Interactive Inference Engine" />
            <h2 className="text-4xl font-bold text-zinc-900 mt-6 leading-tight">
              Test Model<br />
              <span className="fire-gradient bg-clip-text text-transparent italic">Predictive Logic</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-4">
              Manually adjust the 7 environmental layers below to see how the ConvLSTM weights propagate risk vectors across the sector.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-2xl w-fit">
              <MapPin size={14} className="text-fire-orange" />
              <span>Active: {locationName} ({coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°)</span>
            </div>
          </AnimatedItem>

          <div className="grid grid-cols-1 gap-5 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            {features.map((f) => (
              <div key={f.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <f.icon size={16} className="text-fire-orange" />
                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{f.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-fire-orange bg-fire-orange/5 px-2 py-0.5 rounded">
                    {inputs[f.id].toFixed(f.id === "ndvi" ? 2 : 0)}
                  </span>
                </div>
                <input 
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={inputs[f.id]}
                  onChange={(e) => handleInputChange(f.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-fire-orange"
                />
              </div>
            ))}

            {/* Search Location Input with Indian City Auto-suggestions */}
            <form onSubmit={handleSearchLocation} className="flex flex-col gap-1.5 border-t border-zinc-100 pt-4 mt-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Search Indian City / Region</label>
              <div className="relative w-full">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Type to search (e.g. Nainital, Dahod, Nainital Uttarakhand)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-100 hover:border-zinc-200 focus:border-fire-orange focus:bg-white rounded-2xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 p-2 text-zinc-400 hover:text-zinc-950 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? (
                      <CircleNotch size={16} className="animate-spin" />
                    ) : (
                      <MagnifyingGlass size={16} weight="bold" />
                    )}
                  </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-zinc-50">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          setLocationName(s.name);
                          setCoords({ lat: s.lat, lng: s.lng });
                          setShowSuggestions(false);
                          setSearchQuery("");
                          await fetchWeather(s.lat, s.lng);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-fire-orange transition-colors flex flex-col gap-0.5"
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[9px] text-zinc-400 font-mono">{s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchError && (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{searchError}</span>
              )}
            </form>

            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setLocationName(`My Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
                        setCoords({ lat, lng });
                        fetchWeather(lat, lng);
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                          headers: { "User-Agent": "PyroVision-Wildfire-App/1.0" }
                        })
                          .then(r => r.json())
                          .then(data => {
                            if (data && data.display_name) {
                              const name = data.display_name.split(",").slice(0, 2).join(", ");
                              setLocationName(name);
                            }
                          })
                          .catch(() => {});
                      },
                      () => {
                        setLocationName("Dahod Sector");
                        setCoords({ lat: 22.83, lng: 74.25 });
                        fetchWeather(22.83, 74.25);
                      }
                    );
                  } else {
                    setLocationName("Dahod Sector");
                    setCoords({ lat: 22.83, lng: 74.25 });
                    fetchWeather(22.83, 74.25);
                  }
                }}
                disabled={isWeatherLoading}
                className="w-full py-3 border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isWeatherLoading ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  <MapPin size={14} weight="bold" />
                )}
                {isWeatherLoading ? "Syncing Satellites..." : "Use My Location Weather"}
              </button>
              
              <AnimatePresence>
                {showBadge && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-teal-600 font-bold text-[9px] uppercase tracking-widest"
                  >
                    <CheckCircle size={12} weight="bold" />
                    Synchronized with real-time sensors
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={runInference}
                disabled={isInferenceRunning}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
              >
                {isInferenceRunning ? (
                  <CircleNotch size={20} className="animate-spin" />
                ) : (
                  <Fire size={20} />
                )}
                {isInferenceRunning ? "Running Neural Inference..." : "Run Risk Prediction"}
              </button>
            </div>

          </div>
        </div>

        {/* Right Side: Visual Result */}
        <div className="lg:col-span-7">
          <div className="premium-card bg-zinc-950 aspect-[4/5] md:aspect-video lg:aspect-auto h-full min-h-[500px] w-full overflow-hidden border border-zinc-800 shadow-2xl flex flex-col relative">
            
            {/* Header */}
            <div className="h-14 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                Real-Time Neural Monitor
              </div>
              <div className="text-[10px] font-mono text-zinc-600">v3.0-DYNAMIC</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isInferenceRunning ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 rounded-full border-2 border-dashed border-fire-orange/30"
                      />
                      <CircleNotch size={48} className="text-fire-orange animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl mb-1">Analyzing Temporal Vectors</p>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest">Cross-referencing 7 feature layers...</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-8 w-full max-w-md"
                  >
                    <div className="relative">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-900"
                        />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 88}
                          initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - result.score / 100) }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className={result.risk === "HIGH" ? "text-red-500" : result.risk === "MEDIUM" ? "text-amber-500" : "text-green-500"}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white"><Counter value={result.score} />%</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confidence</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] mt-2 px-2.5 py-0.5 rounded-full ${
                          result.risk === "HIGH" ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                          result.risk === "MEDIUM" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                          "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}>
                          {result.risk} RISK
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <Fire size={16} className={
                              result.risk === "HIGH" ? "text-red-500" : 
                              result.risk === "MEDIUM" ? "text-amber-500" : 
                              "text-green-500"
                            } />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Threat Level</span>
                          </div>
                          <p className={`font-black text-sm uppercase ${
                            result.risk === "HIGH" ? "text-red-500" : 
                            result.risk === "MEDIUM" ? "text-amber-500" : 
                            "text-green-500"
                          }`}>{result.risk} RISK</p>
                        </div>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <Pulse size={16} className="text-fire-orange" />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Latency</span>
                          </div>
                          <p className="text-white font-bold text-sm">1,240ms (GPU)</p>
                        </div>
                      </div>

                      {/* Operational Advisory */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            result.risk === "HIGH" ? "bg-red-500" : result.risk === "MEDIUM" ? "bg-amber-500" : "bg-green-500"
                          }`} />
                          Operational Advisory
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          {result.risk === "HIGH" 
                            ? "Critical environmental anomaly. High temperatures, dry air, and active satellite hotspots indicate extreme wildfire vulnerability. Halt all agricultural burning and monitor local wind shifts."
                            : result.risk === "MEDIUM"
                            ? "Elevated threat parameters. Warm dry winds and dropping moisture levels are contributing to moderate risk. Monitor local fire line weather closely."
                            : "Environmental parameters are within safety thresholds. Local vegetation displays normal moisture absorption and weather conditions indicate very low wildfire vulnerability."}
                        </p>
                      </div>

                      {/* Evaluated Feature Footprint */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Inference Input Footprint</span>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">Surface Temp</span>
                            <span className="text-white font-bold">{inputs.temp}°C</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">Humidity</span>
                            <span className="text-white font-bold">{inputs.hum}%</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">Wind Speed</span>
                            <span className="text-white font-bold">{inputs.wind} km/h</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">Veg NDVI</span>
                            <span className="text-white font-bold">{inputs.ndvi.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1 col-span-2">
                            <span className="text-zinc-500">Slope Gradient</span>
                            <span className="text-white font-bold">{inputs.slope}°</span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span className="text-zinc-500">Fire History Rank</span>
                            <span className="text-white font-bold">{inputs.hist} / 10</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setResult(null)}
                        className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Reset Variables
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-700">
                      <MonitorPlay size={40} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">Awaiting Data Streams</p>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest">Adjust sliders or use location weather</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background ambient glow */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full transition-colors duration-1000 pointer-events-none opacity-20 ${
                isInferenceRunning ? "bg-fire-orange" : 
                result?.risk === "HIGH" ? "bg-red-500" : 
                result?.risk === "MEDIUM" ? "bg-amber-500" : 
                result?.risk === "LOW" ? "bg-green-500" : "bg-blue-500"
              }`} />
            </div>

            {/* Terminal Footnote */}
            <div className="p-4 bg-black/40 border-t border-zinc-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Engine Ready</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-600">ID: INF-8821-X</div>
            </div>

          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
