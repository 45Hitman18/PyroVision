export interface RiskZone {
  lat: number;
  lng: number;
  name: string;
  state: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  distance?: number;
}

export const RISK_ZONES: RiskZone[] = [
  { lat: 22.84, lng: 74.25, name: "Dahod", state: "Gujarat", risk: "HIGH" },
  { lat: 29.38, lng: 79.46, name: "Nainital", state: "Uttarakhand", risk: "MEDIUM" },
  { lat: 23.73, lng: 69.86, name: "Kutch", state: "Gujarat", risk: "HIGH" },
  { lat: 22.56, lng: 72.95, name: "Anand", state: "Gujarat", risk: "LOW" },
  { lat: 30.31, lng: 78.03, name: "Dehradun", state: "Uttarakhand", risk: "MEDIUM" },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNearestRiskZone(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) {
    return { 
      nearest: null, 
      distanceKm: null, 
      allZones: RISK_ZONES.map(zone => ({ ...zone, distance: undefined })) 
    };
  }

  const zonesWithDistance = RISK_ZONES.map((zone) => ({
    ...zone,
    distance: haversine(lat, lng, zone.lat, zone.lng),
  })).sort((a, b) => a.distance - b.distance);

  return {
    nearest: zonesWithDistance[0],
    distanceKm: zonesWithDistance[0].distance,
    allZones: zonesWithDistance,
  };
}
