from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Dict
from datetime import datetime
import httpx
import time

router = APIRouter()

# Weather Code Mapping (WMO standard)
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
    95: "Thunderstorm",
}

class WeatherResponse(BaseModel):
    temp_c: float
    humidity_pct: int
    wind_kmh: float
    wind_dir_deg: int
    wind_dir_label: str
    description: str
    lat: float
    lng: float
    fetched_at: datetime

# Cache: key is (lat_1dp, lng_1dp)
_weather_cache: Dict[str, Dict] = {}

def get_wind_label(deg: int) -> str:
    labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = int((deg + 22.5) % 360 / 45)
    return labels[idx]

@router.get("/weather", response_model=WeatherResponse)
async def get_weather(lat: float, lng: float):
    cache_key = f"{round(lat, 1)}_{round(lng, 1)}"
    now = time.time()
    
    if cache_key in _weather_cache:
        cached = _weather_cache[cache_key]
        if now - cached["ts"] < 300: # 5 minutes
            return cached["data"]
            
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json().get("current", {})
            
            result = WeatherResponse(
                temp_c=data.get("temperature_2m", 0),
                humidity_pct=data.get("relative_humidity_2m", 0),
                wind_kmh=data.get("wind_speed_10m", 0),
                wind_dir_deg=data.get("wind_direction_10m", 0),
                wind_dir_label=get_wind_label(data.get("wind_direction_10m", 0)),
                description=WMO_CODES.get(data.get("weather_code", 0), "Unknown"),
                lat=lat,
                lng=lng,
                fetched_at=datetime.now()
            )
            
            _weather_cache[cache_key] = {"ts": now, "data": result}
            return result
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Open-Meteo link failure: {str(e)}")
