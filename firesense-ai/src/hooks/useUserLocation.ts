import { useState, useEffect } from "react";

interface UserLocation {
  lat: number | null;
  lng: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

const CACHE_KEY = "firesense_location";

export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({
    lat: null,
    lng: null,
    city: null,
    state: null,
    country: null,
    isLoading: false,
    error: null,
    isSupported: typeof window !== "undefined" && "geolocation" in navigator,
  });

  const fetchLocationData = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      const { city, town, village, state, country } = data.address || {};
      
      const newLocation = {
        lat,
        lng,
        city: city || town || village || "Unknown",
        state: state || "Unknown",
        country: country || "Unknown",
        isLoading: false,
        error: null,
        isSupported: true,
      };

      setLocation(newLocation);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newLocation));
    } catch (err) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to resolve address data",
      }));
    }
  };

  useEffect(() => {
    if (!location.isSupported) {
      setLocation(prev => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      setLocation(JSON.parse(cached));
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchLocationData(latitude, longitude);
      },
      (error) => {
        let errorMsg = "An unknown error occurred";
        if (error.code === error.PERMISSION_DENIED) errorMsg = "Permission denied";
        if (error.code === error.TIMEOUT) errorMsg = "Location request timed out";
        
        setLocation(prev => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
        }));
      },
      { timeout: 10000 }
    );
  }, [location.isSupported]);

  return location;
}
