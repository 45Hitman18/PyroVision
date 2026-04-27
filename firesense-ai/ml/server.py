from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import uvicorn
import inference

app = FastAPI(title="FireSense AI ML Server")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ndvi: float
    lst: float
    wind_speed: float
    wind_dir: float
    humidity: float
    slope: float
    fire_history: float
    lat: float
    lon: float

class PredictionResponse(BaseModel):
    risk: str
    confidence: float
    probabilities: Dict[str, float]
    location: Dict[str, float]

@app.get("/")
async def root():
    return {"status": "online", "model": "ConvLSTM v3"}

@app.post("/predict", response_model=PredictionResponse)
async def get_prediction(request: PredictionRequest):
    try:
        result = inference.predict(
            ndvi=request.ndvi,
            lst=request.lst,
            wind_speed=request.wind_speed,
            wind_dir=request.wind_dir,
            humidity=request.humidity,
            slope=request.slope,
            fire_history=request.fire_history,
            lat=request.lat,
            lon=request.lon
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
