"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, ZoomControl, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RISK_ZONES, useNearestRiskZone } from "@/hooks/useNearestRiskZone";

interface RiskMapProps {
  forecastHour: number;
  riskLevel: number;
  userLat?: number | null;
  userLng?: number | null;
}

import { useFirmsHotspots, FirmsHotspot } from "@/hooks/useFirmsHotspots";

function FlyToUser({ lat, lng }: { lat?: number | null, lng?: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 8, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

function ZoneLayer({ userLat, userLng }: { userLat?: number | null, userLng?: number | null }) {
  const { allZones } = useNearestRiskZone(userLat ?? null, userLng ?? null);

  const getColor = (risk: string) => {
    if (risk === "HIGH") return "#ef4444";
    if (risk === "MEDIUM") return "#f97316";
    return "#14b8a6";
  };

  return (
    <>
      {allZones.map((zone, i) => (
        <CircleMarker
          key={`zone-${i}`}
          center={[zone.lat, zone.lng]}
          pathOptions={{
            fillColor: getColor(zone.risk),
            fillOpacity: 0.6,
            color: "#ffffff",
            weight: 2,
          }}
          radius={12}
        >
          <Popup>
            <div className="p-2 min-w-[150px] bg-zinc-900 text-white rounded-lg">
              <h4 className="font-black text-sm mb-1">{zone.name}</h4>
              <p className="text-[10px] text-zinc-400 mb-2">{zone.state}</p>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className={`text-[10px] font-black ${zone.risk === "HIGH" ? "text-red-500" : zone.risk === "MEDIUM" ? "text-amber-500" : "text-teal-500"}`}>
                  {zone.risk} RISK
                </span>
                {zone.distance !== undefined && (
                  <span className="text-[10px] text-zinc-500">{zone.distance.toFixed(1)} km</span>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default function RiskMap({ forecastHour, riskLevel, userLat, userLng }: RiskMapProps) {
  const [mounted, setMounted] = useState(false);
  const { hotspots, loading } = useFirmsHotspots(userLat ?? 20.59, userLng ?? 78.96, 2000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case "critical": return "#ef4444"; // Red
      case "high": return "#f97316";     // Orange
      case "moderate": return "#eab308"; // Yellow
      case "low": return "#71717a";      // Gray
      default: return "#71717a";         // Gray
    }
  };

  if (!mounted) return (
    <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing Map Core...</span>
    </div>
  );

  return (
    <div className="w-full h-full relative group">
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-top.leaflet-left { margin-top: 240px !important; margin-left: 20px !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { background-color: rgb(24 24 27 / 0.8) !important; color: white !important; border: 1px solid rgb(63 63 70 / 0.5) !important; backdrop-filter: blur(8px); }
        .leaflet-popup-content-wrapper { background: rgba(9, 9, 11, 0.95) !important; color: white !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; backdrop-filter: blur(12px) !important; border-radius: 1rem !important; padding: 0 !important; }
        .leaflet-popup-tip { background: rgba(9, 9, 11, 0.95) !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
      `}} />
      <MapContainer
        center={[userLat ?? 22.0, userLng ?? 78.96]}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full rounded-[2rem] z-0"
        zoomControl={false}
      >
        <ZoomControl position="topleft" />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        <FlyToUser lat={userLat} lng={userLng} />
        <ZoneLayer userLat={userLat} userLng={userLng} />

        {userLat && userLng && (
          <CircleMarker
            center={[userLat, userLng]}
            pathOptions={{ fillColor: "#3b82f6", fillOpacity: 0.8, color: "#ffffff", weight: 3 }}
            radius={10}
          >
            <Popup>
              <div className="p-2 font-black text-xs text-blue-500 uppercase">Your Location</div>
            </Popup>
          </CircleMarker>
        )}

        {hotspots.map((spot, i) => (
          <CircleMarker
            key={`firms-${i}`}
            center={[spot.lat, spot.lon]}
            pathOptions={{
              fillColor: getThreatColor(spot.threat),
              fillOpacity: 0.6,
              color: "#ffffff",
              weight: 1,
            }}
            radius={spot.threat === "critical" ? 12 : spot.threat === "high" ? 8 : 5}
          >
            <Popup closeButton={false}>
              <div className="p-4 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${spot.threat === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${spot.threat === "critical" ? "text-red-500" : "text-amber-500"}`}>
                    {spot.threat.toUpperCase()} THREAT
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mb-1 uppercase tracking-tight">Satellite Detection</h4>
                <p className="text-[10px] text-zinc-500 font-medium mb-4">Source: {spot.source} · {spot.lat.toFixed(2)}N, {spot.lon.toFixed(2)}E</p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Brightness</p>
                    <p className="text-xs font-black text-white">{spot.brightness.toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Radiative Power</p>
                    <p className="text-xs font-black text-white">{spot.frp.toFixed(1)} MW</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Acquisition Date</p>
                  <p className="text-xs font-black text-white/60 font-mono">{spot.timestamp}</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute bottom-10 right-10 z-10 bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Risk Legend</h5>
        <div className="flex flex-col gap-3">
          {[
            { label: "LOW RISK", color: "bg-teal-500" },
            { label: "MEDIUM RISK", color: "bg-amber-500" },
            { label: "HIGH RISK", color: "bg-red-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
