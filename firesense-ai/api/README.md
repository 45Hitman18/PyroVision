# FireSense AI - FastAPI Prediction Server

Production-ready backend for wildfire risk assessment using ConvLSTM temporal analysis.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuration**
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

3. **Run Server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | GET | Single location prediction (auto-fetches weather) |
| `/api/predict/batch` | POST | Batch prediction for up to 50 locations |
| `/api/zones` | GET | List all monitored zones with live status |
| `/api/gradcam` | POST | Generate explainability heatmap |
| `/api/weather` | GET | Fetch regional weather with 5m caching |
| `/api/alerts/subscribe` | POST | Register for Telegram/SMS notifications |
| `/api/health` | GET | System and model health status |

## Example Usage

### Single Prediction
```bash
curl "http://localhost:8000/api/predict?lat=22.84&lng=74.25"
```

### GradCAM Visualization
```bash
curl -X POST "http://localhost:8000/api/gradcam" \
     -H "Content-Type: application/json" \
     -d '{"ndvi": 0.4, "lst": 35, "wind_speed": 20, "wind_dir": 180, "humidity": 30, "slope": 10, "fire_history": 1, "lat": 22.8, "lng": 74.2}' \
     --output heatmap.png
```

## Architecture
- **Framework**: FastAPI (Async)
- **ML Engine**: PyTorch (ConvLSTM)
- **Attribution**: Captum (LayerGradCam)
- **Data Source**: Open-Meteo API
