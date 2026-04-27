from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List, Dict
import httpx
from model_loader import ModelLoader

router = APIRouter()

# Zone Configuration
MONITORED_ZONES = [
    {"name": "Dahod, Gujarat", "lat": 22.84, "lng": 74.25},
    {"name": "Nainital, Uttarakhand", "lat": 29.38, "lng": 79.46},
    {"name": "Kutch, Gujarat", "lat": 23.73, "lng": 69.86},
    {"name": "Anand, Gujarat", "lat": 22.56, "lng": 72.95},
    {"name": "Dehradun, Uttarakhand", "lat": 30.31, "lng": 78.03}
]

# Simple In-Memory Cache
_zone_cache: Dict[str, Dict] = {}
CACHE_TTL = timedelta(minutes=10)

async def get_zone_data(lat: float, lng: float):
    cache_key = f"{lat}_{lng}"
    now = datetime.now()
    
    if cache_key in _zone_cache:
        cached = _zone_cache[cache_key]
        if now - cached["timestamp"] < CACHE_TTL:
            return cached["data"], True
            
    # Fetch live weather
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        weather = resp.json().get("current", {})
        
    loader = ModelLoader()
    prediction = loader.predict_single(
        ndvi=0.6 - (weather.get("temperature_2m", 25) - 20) * 0.01,
        lst=weather.get("temperature_2m", 25),
        wind_speed=weather.get("wind_speed_10m", 10),
        wind_dir=180,
        humidity=weather.get("relative_humidity_2m", 50),
        slope=12.5,
        fire_history=1.2
    )
    
    data = {
        "weather": weather,
        "prediction": prediction
    }
    
    _zone_cache[cache_key] = {"data": data, "timestamp": now}
    return data, False

@router.get("/zones")
async def list_zones():
    results = []
    cache_hits = []
    
    for zone in MONITORED_ZONES:
        data, hit = await get_zone_data(zone["lat"], zone["lng"])
        results.append({**zone, **data})
        cache_hits.append(hit)
        
    return {
        "zones": results,
        "generated_at": datetime.now(),
        "cache_hit": all(cache_hits) if cache_hits else False
    }

@router.get("/zones/{zone_name}")
async def get_zone_details(zone_name: str):
    # Find zone
    zone = next((z for z in MONITORED_ZONES if z["name"].lower() == zone_name.lower() or z["name"].split(",")[0].lower() == zone_name.lower()), None)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    # Fetch 24h forecast
    url = f"https://api.open-meteo.com/v1/forecast?latitude={zone['lat']}&longitude={zone['lng']}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        forecast = resp.json().get("hourly", {})
        
    loader = ModelLoader()
    risk_trend = []
    
    # Process next 24 hours
    for i in range(24):
        temp = forecast["temperature_2m"][i]
        hum = forecast["relative_humidity_2m"][i]
        ws = forecast["wind_speed_10m"][i]
        
        pred = loader.predict_single(
            ndvi=0.6 - (temp - 20) * 0.01,
            lst=temp,
            wind_speed=ws,
            wind_dir=180,
            humidity=hum,
            slope=12.5,
            fire_history=1.2
        )
        risk_trend.append({
            "hour": i,
            "risk": pred["risk"],
            "confidence": pred["confidence"]
        })
        
    return {
        "zone": zone["name"],
        "current": await get_zone_data(zone["lat"], zone["lng"]),
        "risk_trend": risk_trend
    }
