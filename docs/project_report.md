# PyroVision (FireSense AI) Project Audit & Engineering Report

This report provides a detailed evaluation of the PyroVision (FireSense AI) project. It outlines the **current architecture**, highlights **critical code improvements** (such as TypeScript compilation fixes), details **architectural enhancements** (such as decoupling background tasks), and recommends **advanced new features** to elevate the platform to a state-of-the-art wildfire predictive intelligence system.

---

## 1. Current Architecture & Feature Overview

PyroVision is structured as a modern, decoupled web application combining deep learning and live environmental data feeds:

### 🔍 Core Features
- **Mission Control Dashboard**: Integrates satellite telemetry, local weather intelligence (real-time from Open-Meteo), and predictive FWI (Fire Weather Index).
- **Satellite Hotspot Downlink**: Connects to NASA FIRMS (MODIS & VIIRS) API to map active thermal anomalies in near-real-time (NRT) using Leaflet.
- **Explainable AI (XAI)**: Includes a PyTorch-based MobileNetV2 image classification model to classify fire vs. no-fire, with **Grad-CAM** layer activation maps showing exactly what parts of the image triggered the classification.
- **Alert Dispatch Engine**: A subscription framework sending instantaneous critical alerts via Telegram bots and Twilio SMS.
- **Kaggle Validation Audit**: Re-evaluates historical accuracy matrices against real-world test sets.

### 🛠️ Technology Stack
- **Frontend**: Next.js 15 (App Router), TailwindCSS, Framer Motion, Recharts, React-Leaflet.
- **Backend**: FastAPI (Python), PyTorch, OpenCV, HTTPX.

---

## 2. Critical Code Improvements & Bug Fixes

A compilation scan of the Next.js project revealed several critical TypeScript compiler errors that prevent successful production builds (`npm run build`).

### 1. Recharts ReferenceLine Property Error
- **Location**: `src/components/charts/TrainingCurveChart.tsx` (Line 82)
- **Problem**: The `ReferenceLine` label specifies a non-standard `tracking` (letter-spacing) property:
  ```typescript
  label={{ value: 'OPTIMAL', position: 'top', fill: '#BA7517', fontSize: 8, fontWeight: 900, tracking: '1px' }}
  ```
  `tracking` is not a valid SVG or Recharts text attribute.
- **Solution**: Replace `tracking: '1px'` with `letterSpacing: '1px'` or remove it completely to adhere to SVG specs.

### 2. Leaflet RiskMap Union Type Error
- **Location**: `src/components/dashboard/RiskMap.tsx` (Lines 58-60)
- **Problem**: `useNearestRiskZone` returns an array where distance is computed only when coordinates are supplied. Otherwise, it returns `RISK_ZONES` directly, which has no `distance` key. This creates a type union mismatch:
  ```typescript
  {zone.distance !== undefined && (
    <span>{zone.distance.toFixed(1)} km</span>
  )}
  ```
- **Solution**: Update `RISK_ZONES` or `useNearestRiskZone` to always include a `distance?: number` property in the `RiskZone` interface, ensuring type safety.

### 3. AnimatedItem Prop Interface Mismatch
- **Location**: `src/components/sections/Results.tsx` (Line 179)
- **Problem**: The `AnimatedItem` component is instantiated with an `id="paper"` attribute, but the `AnimatedItemProps` interface only defines `children` and `className`:
  ```typescript
  interface AnimatedItemProps {
    children: ReactNode;
    className?: string;
  }
  ```
- **Solution**: Add `id?: string` to `AnimatedItemProps` in `src/components/ui/AnimatedItem.tsx`, and pass it to the underlying `motion.div`:
  ```typescript
  export default function AnimatedItem({ children, className, id }: AnimatedItemProps) {
    return <motion.div id={id} className={className} variants={itemVariants}>{children}</motion.div>;
  }
  ```

### 4. Framer Motion Variants Type Compatibility
- **Location**: `src/components/ui/AnimatedItem.tsx` (Line 28)
- **Problem**: The transition configuration inside `itemVariants` triggers a type error:
  ```typescript
  transition: { type: "spring", stiffness: 100, damping: 20 }
  ```
  Framer Motion requires explicit casting or strict structures for variant transitions.
- **Solution**: Cast the variants object as `Variants` from `framer-motion`:
  ```typescript
  import { motion, Variants } from "framer-motion";
  const itemVariants: Variants = { ... };
  ```

### 5. Button Component HTML Element Type Clashing
- **Location**: `src/components/ui/Button.tsx` (Line 25)
- **Problem**: `ButtonProps` extends standard `ButtonHTMLAttributes<HTMLButtonElement>`, but `motion.button` overrides click/drag handlers with custom event signatures. Spreading `{...props}` into `<motion.button>` results in a type mismatch.
- **Solution**: Change `ButtonProps` extension target:
  ```typescript
  interface ButtonProps extends React.ComponentPropsWithoutRef<typeof motion.button> {
    variant?: "primary" | "secondary";
    children: React.Node;
  }
  ```

---

## 3. Recommended Architectural Enhancements

To make the platform production-ready and capable of handling scale, the following architectural upgrades should be prioritized:

### 🚀 Asynchronous Task Decoupling
- **Current Issue**: The Telegram listener `poll_telegram_messages` and NASA FIRMS scanner `periodic_alert_worker` run in the background using `asyncio.create_task` directly inside the FastAPI application process. If the web server crashes or restarts, these tasks are interrupted, and scaling to multiple workers will spawn duplicate polling tasks (causing API errors and overlapping alerts).
- **Recommendation**: Decouple the background processes. Move the alert scanner and Telegram engine to a dedicated task worker like **Celery** or **Dramatiq** powered by a **Redis** message broker. Use Telegram **Webhooks** instead of long-polling to handle chat requests reactively.

### ⚡ Caching Layer for Weather and Elevation
- **Current Issue**: The dashboard and sandbox demo query external APIs (Open-Meteo, NASA) on-demand, which can result in rate limits (Open-Meteo limit: 10,000 requests/day) and high latency.
- **Recommendation**: Implement a Redis cache on the backend. Cache weather details for coordinates at a 1-decimal-place grid resolution (approx. 11km) for 15-30 minutes. Elevation data (which is static) should be cached indefinitely.

---

## 4. Proposed Feature Additions (Future Roadmap)

To expand PyroVision's visual appeal and analytical power, we recommend adding the following features:

### 🛠️ 1. Custom Monitoring Geofences (Draw on Map)
- **Concept**: Instead of subscribing to static, predefined cities (like Dahod or Nainital), let users draw custom polygons (bounding boxes or custom shapes) on the Leaflet map.
- **Value**: Forest management agencies can define specific protected reserves or high-vulnerability sectors, triggering alerts only if a FIRMS anomaly falls inside their custom boundary.

### 🛰️ 2. Sentinel/Landsat Satellite Imagery Overlays [IMPLEMENTED]
- **Concept**: Integrate WMS (Web Map Service) layers from Sentinel Hub or Copernicus.
- **Value**: Instead of plain map background tiles, render real NDVI (Normalized Difference Vegetation Index) or false-color infrared heatmaps directly onto the map to show actual vegetation moisture loss and fire scars.

### 📳 3. Alert Escalation Matrix (WhatsApp, SMS & Voice Calls)
- **Concept**: Upgrade the alerting engine to escalate based on threat levels.
  - *Moderate Risk*: Telegram text alert.
  - *High Risk*: Twilio SMS alert.
  - *Critical Risk*: Direct automated phone call via Twilio Voice API, ensuring night-duty forest wardens are immediately woken up.

### 🕸️ 4. Edge Inference with ONNX Runtime Web
- **Concept**: Export the PyTorch MobileNetV2 classification model to the **ONNX** format and load it directly in the client browser using `onnxruntime-web`.
- **Value**: Users in remote forest areas with zero internet connectivity can load the web app offline (via Service Workers/PWA) and run fire classifications on camera images locally without needing a backend server!

### 📊 5. Temporal Prediction Trend Charts [IMPLEMENTED]
- **Concept**: Provide 7-day predictive charts on the dashboard showing the forecasted FWI based on forecasted weather (humidity drop, wind speed spikes, temperature curves).
- **Value**: Moves the platform from reactive monitoring (active fires) to proactive forecasting (upcoming danger zones).
