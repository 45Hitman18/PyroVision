import requests
import csv
import io
from datetime import datetime, timedelta

FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

# Satellite sources — VIIRS is more accurate than MODIS
SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "MODIS_NRT"]

def get_hotspots(api_key: str, lat: float, lon: float,
                 radius_km: int = 100, days: int = 1) -> list:
    """
    Fetch real fire hotspots near a coordinate from NASA FIRMS.
    Returns a list of dicts with lat, lon, brightness, confidence, timestamp.
    """
    hotspots = []

    for source in SOURCES:
        url = f"{FIRMS_BASE_URL}/{api_key}/{source}/{days}/{lat},{lon},{radius_km}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                continue

            reader = csv.DictReader(io.StringIO(response.text))
            for row in reader:
                try:
                    hotspots.append({
                        "lat":        float(row.get("latitude",  row.get("lat", 0))),
                        "lon":        float(row.get("longitude", row.get("lon", 0))),
                        "brightness": float(row.get("bright_ti4",
                                           row.get("brightness", 300))),
                        "confidence": row.get("confidence", "nominal"),
                        "source":     source,
                        "timestamp":  row.get("acq_date", str(datetime.utcnow().date())),
                        "frp":        float(row.get("frp", 0)),  # fire radiative power
                    })
                except (ValueError, KeyError):
                    continue
        except requests.RequestException:
            continue

    # Remove duplicates (same lat/lon from multiple sources)
    seen = set()
    unique = []
    for h in hotspots:
        key = (round(h["lat"], 3), round(h["lon"], 3))
        if key not in seen:
            seen.add(key)
            unique.append(h)

    return unique


def get_global_hotspots(api_key: str, days: int = 1) -> list:
    """
    Fetch worldwide fire hotspots for the last N days.
    Uses the world bounding box.
    """
    url = f"{FIRMS_BASE_URL}/{api_key}/VIIRS_SNPP_NRT/{days}"
    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            return []

        hotspots = []
        reader = csv.DictReader(io.StringIO(response.text))
        for row in reader:
            try:
                hotspots.append({
                    "lat":        float(row.get("latitude", 0)),
                    "lon":        float(row.get("longitude", 0)),
                    "brightness": float(row.get("bright_ti4", 300)),
                    "confidence": row.get("confidence", "nominal"),
                    "source":     "VIIRS_SNPP_NRT",
                    "timestamp":  row.get("acq_date", ""),
                    "frp":        float(row.get("frp", 0)),
                })
            except (ValueError, KeyError):
                continue
        return hotspots
    except requests.RequestException:
        return []


def classify_threat(brightness: float, frp: float, confidence: str) -> str:
    """
    Classify threat level based on brightness temperature and fire radiative power.
    """
    if confidence in ["low", "l"]:
        return "low"
    if brightness > 370 or frp > 100:
        return "critical"
    if brightness > 340 or frp > 50:
        return "high"
    if brightness > 320 or frp > 20:
        return "moderate"
    return "low"
