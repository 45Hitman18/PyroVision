import time
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from model_loader import ModelLoader
from routers import predict, zones, gradcam, weather, alerts, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize model
    print("LOG: Starting FireSense AI API...")
    start_time = time.time()
    ModelLoader() # Trigger singleton initialization
    print(f"LOG: Model loaded successfully in {time.time() - start_time:.2f}s")
    yield
    # Shutdown
    print("LOG: Shutting down FireSense AI API...")

app = FastAPI(
    title="FireSense AI API",
    description="Tactical Wildfire Prediction Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )

# Routers
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(zones.router, prefix="/api", tags=["Zones"])
app.include_router(gradcam.router, prefix="/api", tags=["Visualization"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(health.router, prefix="/api", tags=["Health"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
