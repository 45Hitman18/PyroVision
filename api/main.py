from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from firms import get_hotspots, get_global_hotspots, classify_threat
from model import analyze_image, get_model_stats
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="PyroVision API")

# Update CORS to allow all local dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # More permissive for development
    allow_methods=["*"],
    allow_headers=["*"],
)

NASA_KEY = os.getenv("NASA_FIRMS_API_KEY", "5a5818d708a2c856fd8470ea93d6611c")

# --- Fire detection ---
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    result = analyze_image(contents)
    return result

# --- Model stats ---
@app.get("/model/stats")
def model_stats():
    return get_model_stats()

# --- NASA FIRMS hotspots ---
@app.get("/hotspots")
def hotspots(lat: float, lon: float, radius: int = 100, days: int = 1):
    raw = get_hotspots(NASA_KEY, lat, lon, radius, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    return {"count": len(raw), "hotspots": raw}

@app.get("/hotspots/india")
def hotspots_india(days: int = 1):
    # Centered on India with 2000km radius
    raw = get_hotspots(NASA_KEY, 20.5937, 78.9629, 2000, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    return {"count": len(raw), "hotspots": raw}

@app.get("/hotspots/global")
def hotspots_global(days: int = 1):
    raw = get_global_hotspots(NASA_KEY, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    return {"count": len(raw), "hotspots": raw}

@app.get("/health")
def health():
    return {"status": "online", "model": "mobilenetv2_fire", "nasa_firms": "connected" if NASA_KEY else "disconnected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
