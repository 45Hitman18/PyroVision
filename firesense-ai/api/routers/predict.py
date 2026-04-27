from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import httpx
import time
from datetime import datetime
from model_loader import ModelLoader

router = APIRouter()

class PredictionFeatures(BaseModel):
    ndvi: float
    lst: float
    wind_speed: float
    wind_dir: float
    humidity: float
    slope: float
    fire_history: float

class PredictionResponse(BaseModel):
    lat: float
    lng: float
    risk: str
    confidence: float
    probabilities: dict
    features_used: PredictionFeatures
    weather_source: str
    inference_ms: float
    timestamp: datetime

class BatchLocation(BaseModel):
    lat: float
    lng: float
    ndvi: Optional[float] = None
    lst: Optional[float] = None
    wind_speed: Optional[float] = None
    humidity: Optional[float] = None

class BatchPredictRequest(BaseModel):
    locations: List[BatchLocation]

class BatchPredictResponse(BaseModel):
    results: List[dict]
    total_inference_ms: float
    high_risk_count: int
    locations_processed: int

async def fetch_weather(lat: float, lng: float):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            return data.get("current", {})
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Weather service unavailable: {str(e)}")

@router.get("/predict", response_model=PredictionResponse)
async def get_prediction(
    lat: float, 
    lng: float, 
    ndvi: Optional[float] = None, 
    lst: Optional[float] = None, 
    wind_speed: Optional[float] = None, 
    humidity: Optional[float] = None,
    slope: Optional[float] = None,
    fire_history: Optional[float] = None
):
    source = "provided"
    current_weather = {}
    
    if any(v is None for v in [ndvi, lst, wind_speed, humidity]):
        current_weather = await fetch_weather(lat, lng)
        source = "open-meteo"
        
    final_ndvi = ndvi if ndvi is not None else (0.6 - (current_weather.get("temperature_2m", 25) - 20) * 0.01)
    final_lst = lst if lst is not None else current_weather.get("temperature_2m", 25)
    final_ws = wind_speed if wind_speed is not None else current_weather.get("wind_speed_10m", 10)
    final_wd = current_weather.get("wind_direction_10m", 180)
    final_hum = humidity if humidity is not None else current_weather.get("relative_humidity_2m", 50)
    
    final_slope = slope if slope is not None else 12.5
    final_hist = fire_history if fire_history is not None else 1.2
    
    loader = ModelLoader()
    result = loader.predict_single(
        ndvi=final_ndvi, 
        lst=final_lst, 
        wind_speed=final_ws, 
        wind_dir=final_wd, 
        humidity=final_hum, 
        slope=final_slope, 
        fire_history=final_hist
    )
    
    features = PredictionFeatures(
        ndvi=final_ndvi,
        lst=final_lst,
        wind_speed=final_ws,
        wind_dir=final_wd,
        humidity=final_hum,
        slope=final_slope,
        fire_history=final_hist
    )
    
    return PredictionResponse(
        lat=lat,
        lng=lng,
        risk=result["risk"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        features_used=features,
        weather_source=source,
        inference_ms=result["inference_ms"],
        timestamp=datetime.now()
    )

@router.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(request: BatchPredictRequest):
    if len(request.locations) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 locations allowed per batch")
    
    start_time = time.time()
    results = []
    high_risk_count = 0
    
    for loc in request.locations:
        # For batch, we expect features or we skip for brevity in this complex example
        # In production, we might fetch weather for all if missing
        res = await get_prediction(loc.lat, loc.lng, loc.ndvi, loc.lst, loc.wind_speed, loc.humidity)
        res_dict = res.model_dump()
        results.append(res_dict)
        if res_dict["risk"] == "HIGH":
            high_risk_count += 1
            
    return BatchPredictResponse(
        results=results,
        total_inference_ms=(time.time() - start_time) * 1000,
        high_risk_count=high_risk_count,
        locations_processed=len(results)
    )
