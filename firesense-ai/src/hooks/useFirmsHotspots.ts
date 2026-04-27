"use client";

import { useState, useEffect } from "react";

export interface FirmsHotspot {
  lat: number;
  lon: number;
  brightness: number;
  confidence: string;
  source: string;
  timestamp: string;
  frp: number;
  threat: string;
}

export function useFirmsHotspots(lat: number = 20.59, lon: number = 78.96, radius: number = 2000) {
  const [hotspots, setHotspots] = useState<FirmsHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/hotspots?lat=${lat}&lon=${lon}&radius=${radius}&days=1`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch FIRMS data");
        return res.json();
      })
      .then((data) => {
        setHotspots(data.hotspots);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [lat, lon, radius]);

  return { hotspots, loading, error };
}
