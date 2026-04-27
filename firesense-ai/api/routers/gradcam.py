from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO
import os
from model_loader import ModelLoader

router = APIRouter()

class GradCAMRequest(BaseModel):
    ndvi: float
    lst: float
    wind_speed: float
    wind_dir: float
    humidity: float
    slope: float
    fire_history: float
    lat: float
    lng: float

@router.post("/gradcam")
async def generate_gradcam(request: GradCAMRequest):
    loader = ModelLoader()
    try:
        image_bytes = loader.generate_gradcam(
            ndvi=request.ndvi,
            lst=request.lst,
            wind_speed=request.wind_speed,
            wind_dir=request.wind_dir,
            humidity=request.humidity,
            slope=request.slope,
            fire_history=request.fire_history
        )
        
        # Get risk level for header
        pred = loader.predict_single(
            ndvi=request.ndvi,
            lst=request.lst,
            wind_speed=request.wind_speed,
            wind_dir=request.wind_dir,
            humidity=request.humidity,
            slope=request.slope,
            fire_history=request.fire_history
        )
        
        return StreamingResponse(
            BytesIO(image_bytes), 
            media_type="image/png",
            headers={"X-Risk-Level": pred["risk"]}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GradCAM generation failed: {str(e)}")

@router.get("/gradcam/sample")
async def get_sample_gradcam():
    # Robust path resolution
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Try multiple common locations
    paths_to_try = [
        os.path.join(base_dir, "ml", "outputs", "gradcam_sample.png"),
        os.path.join(os.getcwd(), "ml", "outputs", "gradcam_sample.png"),
        os.path.join(os.getcwd(), "..", "ml", "outputs", "gradcam_sample.png"),
    ]
    
    sample_path = None
    for p in paths_to_try:
        if os.path.exists(p):
            sample_path = p
            break
            
    if not sample_path:
        # Create a dummy sample if it doesn't exist anywhere
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (600, 600), color = (20, 20, 20))
        d = ImageDraw.Draw(img)
        # Draw some "fake" heatmap circles to avoid pure black
        d.ellipse([100, 100, 400, 400], fill=(255, 69, 0, 100))
        d.text((200, 280), "GENERATING VISUALIZATION...", fill=(255, 255, 255))
        
        # Ensure directory exists
        fallback_dir = os.path.join(os.getcwd(), "ml", "outputs")
        os.makedirs(fallback_dir, exist_ok=True)
        sample_path = os.path.join(fallback_dir, "gradcam_sample.png")
        img.save(sample_path)
        
    def iterfile():
        with open(sample_path, mode="rb") as file_like:
            yield from file_like
            
    return StreamingResponse(iterfile(), media_type="image/png")
