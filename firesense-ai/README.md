# 🖥️ PyroVision: Frontend Surveillance UI (Next.js)

This subdirectory contains the frontend dashboard and tactical monitoring interface for the **PyroVision** platform.

For the full system setup, API guides, and machine learning models, please refer to the main repository [Root README](../README.md).

---

## 📚 Academic Context & Publication
The research paper for this project, authored by **Thakar Pariksihit**, is officially published on Zenodo.
- **Official Link**: [Zenodo Record 20782440](https://zenodo.org/records/20782440)

---

## ✨ Surveillance Features Implemented
- **Leaflet.js Tactical Navigator**: Map plotting satellite hotspot anomalies and drawing custom geofences.
- **7-Day Weather & FWI Forecasting**: Queries Open-Meteo for max temperature, min humidity, and max wind speed, and computes dynamic hazard curves using Recharts.
- **Mission Control HUD logs**: Real-time streaming log dispatcher monitoring satellite downlinks.
- **PyTorch ML Diagnostic Centre**: Monitors live inference throughput (FPS), GPU utilisation, VRAM consumption, Precision-Recall validation curves, and decodes Grad-CAM interpretability heatmaps.
- **Academic PDF Generator**: Local client-side compile engine that exports professional double-column papers based on current telemetry.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
*Note: To run both the Next.js UI and the FastAPI backend together, run `npm run dev` from the **root directory** of the repository instead.*

---

## 🛠️ Folder Structure
- `/src/app/dashboard`: Main dashboard layout and tracking control loops.
- `/src/components/dashboard`: Interactive map canvas, geofence drawers, and custom HUDs.
- `/src/components/charts`: Interactive model telemetry widgets.
- `/scripts`: Custom launcher scripts for spawning single uvicorn/Next dev processes.
