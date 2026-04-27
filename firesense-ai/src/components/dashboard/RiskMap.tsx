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

const hotspots = [
  { lat: 22.84, lng: 74.25, size: 40, name: "Dahod Sector" },
  { lat: 30.31, lng: 78.03, size: 35, name: "Dehradun Range" },
  { lat: 21.75, lng: 80.67, size: 45, name: "Kanha Reserve" },
  { lat: 15.31, lng: 74.12, size: 25, name: "Western Ghats" },
  { lat: 26.66, lng: 93.17, size: 30, name: "Kaziranga Park" },
  { lat: 19.15, lng: 81.86, size: 40, name: "Bastar Forest" },
];

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
  const [predictions, setPredictions] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
    const fetchAllPredictions = async () => {
      const results: Record<string, any> = {};
      for (const spot of hotspots) {
        try {
          const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ndvi: 0.45, lst: 35.0, wind_speed: 15.0, wind_dir: 180,
              humidity: 40, slope: 12.5, fire_history: 1.2, lat: spot.lat, lon: spot.lng
            })
          });
          results[spot.name] = await res.json();
        } catch (e) {
          console.error(`Failed to fetch prediction for ${spot.name}:`, e);
        }
      }
      setPredictions(results);
    };
    fetchAllPredictions();
  }, []);

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
        center={[22.0, 78.96]}
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
            key={`hotspot-${i}`}
            center={[spot.lat, spot.lng]}
            pathOptions={{
              fillColor: "#f97316",
              fillOpacity: 0.3 + (forecastHour / 200),
              color: "transparent",
              weight: 0,
            }}
            radius={spot.size + (forecastHour * 1.2)}
          />
        ))}

        {hotspots.map((spot, i) => {
          const pred = predictions[spot.name];
          const riskColor = pred?.risk === "HIGH" ? "text-red-500" : pred?.risk === "MEDIUM" ? "text-amber-500" : "text-green-500";
          return (
            <CircleMarker
              key={`core-${i}`}
              center={[spot.lat, spot.lng]}
              pathOptions={{
                fillColor: pred?.risk === "HIGH" ? "#ef4444" : "#f97316",
                fillOpacity: 0.8,
                color: "#ffffff",
                weight: 1,
              }}
              radius={5 + (forecastHour / 10)}
            >
              <Popup closeButton={false}>
                <div className="p-4 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${pred?.risk === "HIGH" ? "bg-red-500" : "bg-amber-500"}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${riskColor}`}>
                      {pred ? `${pred.risk} RISK` : "Calculating..."}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-1 uppercase tracking-tight">{spot.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mb-4">Location: {spot.lat}°N, {spot.lng}°E</p>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Confidence</p>
                      <p className="text-xs font-black text-white">{pred ? `${(pred.confidence * 100).toFixed(1)}%` : "--"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Intensity</p>
                      <p className="text-xs font-black text-white">{Math.floor(spot.size * 2.4)} MW</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
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
