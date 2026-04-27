from fastapi import APIRouter
from datetime import datetime
import time
from model_loader import ModelLoader

router = APIRouter()
START_TIME = time.time()

@router.get("/health")
async def health_check():
    loader = ModelLoader()
    return {
        "status": "ok",
        "model_loaded": loader._model is not None,
        "model_device": str(loader._device),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "version": "1.0.0"
    }

@router.get("/health/ping")
async def ping():
    return {"pong": True, "ts": datetime.now()}
