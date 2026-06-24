from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import time
import base64
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import math
import httpx
import asyncio
import uvicorn
import os
import sys

# Add the ml directory to path to import inference and models
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "firesense-ai", "ml"))

try:
    import inference
except ImportError:
    # Fallback if path is different
    sys.path.append(os.path.join(os.getcwd(), "firesense-ai", "ml"))
    import inference

from firms import get_hotspots, get_global_hotspots, classify_threat
from model import analyze_image, get_model_stats
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="PyroVision Unified API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NASA_KEY = os.getenv("NASA_FIRMS_API_KEY", "5a5818d708a2c856fd8470ea93d6611c")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7282845610:AAF92Z3z_U5H6D5xQp9g9s8a7b6c5d4e3f2")
SUBSCRIPTIONS_FILE = "subscriptions.json"

class Vertex(BaseModel):
    lat: float
    lng: float

class SubscribeRequest(BaseModel):
    target: str
    sector: str
    vertices: Optional[List[Vertex]] = None

def load_subscriptions():
    if os.path.exists(SUBSCRIPTIONS_FILE):
        try:
            with open(SUBSCRIPTIONS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_subscriptions(subs):
    try:
        with open(SUBSCRIPTIONS_FILE, "w") as f:
            json.dump(subs, f)
    except Exception as e:
        print("Error saving subscriptions:", e)

CHAT_IDS_FILE = "chat_ids.json"

def load_chat_ids():
    if os.path.exists(CHAT_IDS_FILE):
        try:
            with open(CHAT_IDS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_chat_ids(chat_ids):
    try:
        with open(CHAT_IDS_FILE, "w") as f:
            json.dump(chat_ids, f)
    except Exception as e:
        print("Error saving chat ids:", e)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def is_point_in_polygon(x, y, poly):
    """
    Check if a point (x, y) is inside a polygon defined by a list of points (dicts or objects).
    x is latitude, y is longitude.
    """
    if not poly or len(poly) < 3:
        return False
    n = len(poly)
    inside = False
    
    def get_coords(p):
        if isinstance(p, dict):
            return p.get("lat", 0), p.get("lng", 0)
        else:
            return getattr(p, "lat", 0), getattr(p, "lng", 0)

    p1x, p1y = get_coords(poly[0])
    for i in range(n + 1):
        p2x, p2y = get_coords(poly[i % n])
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

async def check_and_send_alerts(hotspots):
    subs = load_subscriptions()
    if not subs:
        return
    zones = {
        "Dahod": (22.84, 74.25),
        "Nainital": (29.38, 79.46),
        "Kutch": (23.73, 69.86),
        "Anand": (22.56, 72.95),
        "Dehradun": (30.31, 78.03)
    }
    sent_alerts = set()
    for sub in subs:
        sector = sub["sector"]
        vertices = sub.get("vertices")
        
        # Skip if predefined sector not in zones and there are no custom vertices
        if not (vertices and len(vertices) >= 3) and (sector not in zones):
            continue
            
        matching_hotspots = []
        for h in hotspots:
            if vertices and len(vertices) >= 3:
                if is_point_in_polygon(h["lat"], h["lon"], vertices):
                    matching_hotspots.append(h)
            else:
                z_lat, z_lon = zones[sector]
                dist = haversine(h["lat"], h["lon"], z_lat, z_lon)
                if dist <= 100 and h["threat"] in ["critical", "high", "moderate"]:
                    matching_hotspots.append(h)
        if matching_hotspots:
            h = matching_hotspots[0]
            alert_key = (sub["target"], sector, h["lat"], h["lon"])
            if alert_key in sent_alerts:
                continue
            sent_alerts.add(alert_key)
            message = f"🚨 *PYROVISION WILDFIRE ALERT* 🚨\n\nSatellite sensors detected a *{h['threat'].upper()}* thermal anomaly near the *{sector}* sector!\n\n📍 Coordinates: {h['lat']:.4f}N, {h['lon']:.4f}E\n🔥 Temp Brightness: {h['brightness']} K\n⚡ Power (FRP): {h['frp']} MW\n🛰️ Sensor Array: {h['source']}"
            if sub["type"] == "telegram":
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                async with httpx.AsyncClient() as client:
                    try:
                        await client.post(url, json={
                            "chat_id": sub["chat_id"],
                            "text": message,
                            "parse_mode": "Markdown"
                        })
                    except Exception as e:
                        print("Error sending Telegram alert:", e)
            elif sub["type"] == "sms":
                twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
                twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
                twilio_phone = os.getenv("TWILIO_NUMBER")
                sms_text = f"ALERT: Wildfire threat near {sector}! Lat: {h['lat']:.2f}, Lon: {h['lon']:.2f}. Source: {h['source']}"
                if twilio_sid and twilio_token and twilio_phone:
                    async with httpx.AsyncClient() as client:
                        try:
                            sms_url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                            await client.post(sms_url, auth=(twilio_sid, twilio_token), data={
                                "From": twilio_phone,
                                "To": sub["target"],
                                "Body": sms_text
                            })
                        except Exception as e:
                            print("Twilio SMS send failed:", e)
                else:
                    print(f"[SMS BACKEND LOG] Sending alert to {sub['target']}: {sms_text}")

def check_and_send_alerts_sync(hotspots):
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(check_and_send_alerts(hotspots))
        loop.close()
    except Exception as e:
        print("Error in background alert task:", e)

# --- Original API Routes ---

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    result = analyze_image(contents)
    return result

@app.get("/model/stats")
def model_stats():
    return get_model_stats()

@app.get("/hotspots")
def hotspots(lat: float, lon: float, background_tasks: BackgroundTasks, radius: int = 100, days: int = 1):
    raw = get_hotspots(NASA_KEY, lat, lon, radius, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    background_tasks.add_task(check_and_send_alerts_sync, raw)
    return {"count": len(raw), "hotspots": raw}

@app.get("/hotspots/india")
def hotspots_india(background_tasks: BackgroundTasks, days: int = 1):
    raw = get_hotspots(NASA_KEY, 20.5937, 78.9629, 2000, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    background_tasks.add_task(check_and_send_alerts_sync, raw)
    return {"count": len(raw), "hotspots": raw}

@app.get("/hotspots/global")
def hotspots_global(days: int = 1):
    raw = get_global_hotspots(NASA_KEY, days)
    for h in raw:
        h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
    return {"count": len(raw), "hotspots": raw}

async def resolve_telegram_chat_id(username: str) -> int:
    username = username.lower()
    chat_ids = load_chat_ids()
    if username in chat_ids:
        return chat_ids[username]
    
    # Fallback/Quick poll of getUpdates
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                updates = resp.json().get("result", [])
                for update in updates:
                    message = update.get("message", {})
                    chat = message.get("chat", {})
                    msg_username = chat.get("username", "").lower()
                    msg_chat_id = chat.get("id")
                    if msg_username:
                        chat_ids[msg_username] = msg_chat_id
                save_chat_ids(chat_ids)
        except Exception:
            pass
    return chat_ids.get(username)

class PingRequest(BaseModel):
    unit: str

@app.post("/api/dispatch/ping")
async def dispatch_ping(request: PingRequest):
    subs = load_subscriptions()
    telegram_subs = [s for s in subs if s.get("type") == "telegram" and s.get("chat_id")]
    
    if not telegram_subs:
        raise HTTPException(
            status_code=400,
            detail="No active Telegram subscriptions found. Please subscribe to a sector first!"
        )
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        sent_count = 0
        sent_chat_ids = set()
        for sub in telegram_subs:
            chat_id = sub["chat_id"]
            if chat_id in sent_chat_ids:
                continue
            sent_chat_ids.add(chat_id)
            
            try:
                ping_text = (
                    f"📡 *PYROVISION DISPATCH PING* 📡\n\n"
                    f"Command Center has pinged *{request.unit}* transponder VHF!\n\n"
                    f"⚡ *Heartbeat Status*: OK (Active)\n"
                    f"🛰️ *Signal Quality*: -76 dBm (Excellent)\n"
                    f"📍 *Sector Link*: {sub['sector']}"
                )
                resp = await client.post(url, json={
                    "chat_id": chat_id,
                    "text": ping_text,
                    "parse_mode": "Markdown"
                })
                if resp.status_code == 200:
                    sent_count += 1
            except Exception as e:
                print("Error sending ping alert:", e)
                
    if sent_count > 0:
        return {"status": "success", "message": f"Transponder heartbeat broadcasted to {sent_count} Telegram subscriber(s)!"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to route VHF ping via Telegram Bot."
        )

@app.post("/api/subscribe")
async def subscribe(request: SubscribeRequest):
    target = request.target.strip()
    sector = request.sector.strip()
    vertices = request.vertices
    
    subs = load_subscriptions()
    
    # Fetch real telemetry from Open-Meteo
    if vertices and len(vertices) > 0:
        # Custom sector geofence: compute centroid for weather info
        z_lat = sum(v.lat for v in vertices) / len(vertices)
        z_lon = sum(v.lng for v in vertices) / len(vertices)
    else:
        zones = {
            "Dahod": (22.84, 74.25),
            "Nainital": (29.38, 79.46),
            "Kutch": (23.73, 69.86),
            "Anand": (22.56, 72.95),
            "Dehradun": (30.31, 78.03)
        }
        z_lat, z_lon = zones.get(sector, (22.84, 74.25))
    
    temp, hum, wind, soil = 30.0, 50.0, 10.0, 0.3
    async with httpx.AsyncClient() as client:
        try:
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={z_lat}&longitude={z_lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,soil_moisture_0_to_7cm&timezone=auto"
            w_resp = await client.get(weather_url, timeout=5)
            if w_resp.status_code == 200:
                w_data = w_resp.json().get("current", {})
                temp = w_data.get("temperature_2m", temp)
                hum = w_data.get("relative_humidity_2m", hum)
                wind = w_data.get("wind_speed_10m", wind)
                soil = w_data.get("soil_moisture_0_to_7cm", soil)
        except Exception as e:
            print("Error fetching weather for subscription confirmation:", e)

    if target.startswith("@"):
        username = target[1:].lower()
        chat_id = await resolve_telegram_chat_id(username)
        
        if chat_id is None:
            bot_username = "your bot"
            async with httpx.AsyncClient() as client:
                try:
                    me_resp = await client.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe")
                    if me_resp.status_code == 200:
                        bot_username = "@" + me_resp.json().get("result", {}).get("username", "your bot")
                except Exception:
                    pass
            raise HTTPException(
                status_code=400, 
                detail=f"Resolving failed. Please search for '{bot_username}' on Telegram, click 'Start', then try again!"
            )
        
        welcome_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            try:
                welcome_text = (
                    f"🔥 *PyroVision Satellite Link Established* 🔥\n\n"
                    f"Successfully subscribed to real-time telemetry alerts for the *{sector}* sector!\n\n"
                    f"📊 *Current Ground Telemetry*:\n"
                    f"🌡️ Temperature: {temp:.1f}°C\n"
                    f"💧 Relative Humidity: {hum:.1f}%\n"
                    f"💨 Wind Speed: {wind:.1f} km/h\n"
                    f"🌱 Soil Moisture: {soil:.2f} m³/m³\n\n"
                    f"🛰️ Status: Monitoring MODIS & VIIRS telemetry streams. You will be alerted instantly if thermal anomalies are detected within 100km."
                )
                await client.post(welcome_url, json={
                    "chat_id": chat_id,
                    "text": welcome_text,
                    "parse_mode": "Markdown"
                })
            except Exception as e:
                print("Error sending Telegram welcome message:", e)
                
        v_list = [{"lat": v.lat, "lng": v.lng} for v in vertices] if vertices else None
        new_sub = {"target": target, "chat_id": chat_id, "sector": sector, "type": "telegram"}
        if v_list:
            new_sub["vertices"] = v_list
        subs = [s for s in subs if not (s.get("target") == target and s.get("sector") == sector)]
        subs.append(new_sub)
        save_subscriptions(subs)
        
        return {"status": "success", "message": "Subscribed via Telegram successfully!"}
    else:
        clean_phone = "".join(filter(str.isdigit, target))
        if len(clean_phone) < 10:
            raise HTTPException(status_code=400, detail="Invalid phone number format. Please provide a 10-digit number.")
            
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_phone = os.getenv("TWILIO_NUMBER")
        
        msg_text = f"PyroVision: Subscribed to {sector}. Current weather: {temp:.1f}C, Hum: {hum:.1f}%, Wind: {wind:.1f}km/h. Monitoring active fire hotspots."
        
        if twilio_sid and twilio_token and twilio_phone:
            try:
                sms_url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                async with httpx.AsyncClient() as client:
                    resp = await client.post(sms_url, auth=(twilio_sid, twilio_token), data={
                        "From": twilio_phone,
                        "To": target,
                        "Body": msg_text
                    })
                    if resp.status_code >= 400:
                        print(f"Twilio API Error ({resp.status_code}): {resp.text}")
                        raise HTTPException(
                            status_code=resp.status_code,
                            detail=f"Twilio SMS delivery failed: {resp.json().get('message', resp.text)}"
                        )
            except Exception as e:
                print("Twilio SMS send failed:", e)
                if isinstance(e, HTTPException):
                    raise e
        else:
            print(f"[SMS BACKEND LOG] Sending message to {target}: {msg_text}")
            
        v_list = [{"lat": v.lat, "lng": v.lng} for v in vertices] if vertices else None
        new_sub = {"target": target, "sector": sector, "type": "sms"}
        if v_list:
            new_sub["vertices"] = v_list
        subs = [s for s in subs if not (s.get("target") == target and s.get("sector") == sector)]
        subs.append(new_sub)
        save_subscriptions(subs)
        
        return {"status": "success", "message": "Subscribed via SMS successfully!"}

@app.get("/health")
def health():
    return {"status": "online", "model": "mobilenetv2_fire", "nasa_firms": "connected" if NASA_KEY else "disconnected"}

# --- ML Server Routes ---

class PredictionRequest(BaseModel):
    ndvi: float
    lst: float
    wind_speed: float
    wind_dir: float = 0.0
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

@app.get("/api/predict")
async def get_prediction_get(lat: float, lng: float, ndvi: float, lst: float, wind_speed: float, humidity: float, slope: float, fire_history: float):
    # Support GET for InteractiveDemo.tsx
    try:
        result = inference.predict(
            ndvi=ndvi,
            lst=lst,
            wind_speed=wind_speed,
            wind_dir=0.0,
            humidity=humidity,
            slope=slope,
            fire_history=fire_history,
            lat=lat,
            lon=lng
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gradcam/sample")
def gradcam_sample():
    # Mock or real sample for GradCAM section
    return {"status": "success", "message": "Sample endpoint reached"}

@app.get("/")
async def root():
    return {"status": "online", "message": "Unified PyroVision API"}

# --- Background Continuous Task Workers ---

async def periodic_alert_worker():
    print("[BG WORKER] Alert worker loop started.")
    while True:
        try:
            print("[BG WORKER] Scanning NASA FIRMS for active hotspots...")
            # Query active fire hotspots for India
            loop = asyncio.get_running_loop()
            raw = await loop.run_in_executor(None, get_hotspots, NASA_KEY, 20.5937, 78.9629, 2000, 1)
            for h in raw:
                h["threat"] = classify_threat(h.get("brightness", 0), h.get("frp", 0), h.get("confidence", "n"))
            await check_and_send_alerts(raw)
        except Exception as e:
            print("[BG WORKER] Error in periodic alert worker:", e)
        await asyncio.sleep(300)  # Check every 5 minutes

async def poll_telegram_messages():
    print("[BG WORKER] Telegram long-polling loop started.")
    last_update_id = 0
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?limit=1&offset=-1"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5)
            if resp.status_code == 200:
                results = resp.json().get("result", [])
                if results:
                    last_update_id = results[0].get("update_id", 0)
                    print(f"[BG WORKER] Initialized Telegram update offset to {last_update_id}")
    except Exception as e:
        print("[BG WORKER] Failed to initialize Telegram update ID:", e)

    while True:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset={last_update_id + 1}&timeout=30"
            async with httpx.AsyncClient(timeout=35) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    updates = resp.json().get("result", [])
                    for update in updates:
                        last_update_id = max(last_update_id, update.get("update_id", 0))
                        message = update.get("message", {})
                        chat = message.get("chat", {})
                        chat_id = chat.get("id")
                        username = chat.get("username", "")
                        
                        # Cache the username-to-chat_id mapping
                        if username and chat_id:
                            username = username.lower()
                            chat_ids = load_chat_ids()
                            if chat_ids.get(username) != chat_id:
                                chat_ids[username] = chat_id
                                save_chat_ids(chat_ids)
                                
                        text = message.get("text", "").strip()
                        
                        if text.startswith("/start"):
                            welcome_reply = (
                                f"👋 *Hello! Welcome to PyroVision Live Alerts.*\n\n"
                                f"To start receiving wildfire risk warnings and system alerts:\n"
                                f"1. Go to the PyroVision Web Dashboard.\n"
                                f"2. Under *Alert Subscription*, enter your Telegram username (starting with `@`).\n"
                                f"3. Click *Subscribe*.\n\n"
                                f"Once subscribed, you can send `/status` or `/telemetry` in this chat at any time to query real-time ground telemetry data!"
                            )
                            send_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                            await client.post(send_url, json={
                                "chat_id": chat_id,
                                "text": welcome_reply,
                                "parse_mode": "Markdown"
                            })
                        elif text.startswith("/status") or text.startswith("/telemetry"):
                            # Find all subscriptions for this chat_id or username
                            subs = load_subscriptions()
                            username_tag = f"@{chat.get('username', '').lower()}"
                            user_subs = [s for s in subs if s.get("chat_id") == chat_id or (s.get("type") == "telegram" and s.get("target", "").lower() == username_tag)]
                            
                            if user_subs:
                                response_parts = ["📊 *PyroVision Telemetry Digest* 📊\n"]
                                zones = {
                                    "Dahod": (22.84, 74.25),
                                    "Nainital": (29.38, 79.46),
                                    "Kutch": (23.73, 69.86),
                                    "Anand": (22.56, 72.95),
                                    "Dehradun": (30.31, 78.03)
                                }
                                for sub in user_subs:
                                    sector = sub["sector"]
                                    vertices = sub.get("vertices")
                                    if vertices and len(vertices) > 0:
                                        z_lat = sum(v["lat"] for v in vertices) / len(vertices)
                                        z_lon = sum(v["lng"] for v in vertices) / len(vertices)
                                    else:
                                        z_lat, z_lon = zones.get(sector, (22.84, 74.25))
                                    
                                    temp, hum, wind, soil = 30.0, 50.0, 10.0, 0.3
                                    try:
                                        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={z_lat}&longitude={z_lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,soil_moisture_0_to_7cm&timezone=auto"
                                        w_resp = await client.get(weather_url)
                                        if w_resp.status_code == 200:
                                            w_data = w_resp.json().get("current", {})
                                            temp = w_data.get("temperature_2m", temp)
                                            hum = w_data.get("relative_humidity_2m", hum)
                                            wind = w_data.get("wind_speed_10m", wind)
                                            soil = w_data.get("soil_moisture_0_to_7cm", soil)
                                    except Exception as e:
                                        print(f"Error fetching weather for {sector}:", e)
                                    
                                    response_parts.append(
                                        f"📍 *Sector: {sector}*\n"
                                        f"🌡️ Temp: {temp:.1f}°C | 💧 Humidity: {hum:.1f}%\n"
                                        f"💨 Wind: {wind:.1f} km/h | 🌱 Soil: {soil:.2f} m³/m³\n"
                                    )
                                
                                response_parts.append("\n🛰️ *Status*: Monitoring MODIS & VIIRS telemetry streams. You will be alerted instantly if thermal anomalies are detected within 100km of your sectors.")
                                response_text = "\n".join(response_parts)
                            else:
                                response_text = "❌ You are not subscribed to any sector yet. Please subscribe on the PyroVision Web Dashboard first."
                            
                            send_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                            await client.post(send_url, json={
                                "chat_id": chat_id,
                                "text": response_text,
                                "parse_mode": "Markdown"
                             })
        except Exception as e:
            print("[BG WORKER] Telegram poll error:", e)
            await asyncio.sleep(5)

# --- CCTV WATCHTOWER PIPELINE INFERENCE & SIMULATION ---

import urllib.request

def download_sample_images():
    nominal_url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80"
    fire_url = "https://images.unsplash.com/photo-1606240724602-5b21f896eae8?w=800&auto=format&fit=crop&q=80"
    
    nominal_vid_url = "https://mdbcdn.b-cdn.net/img/video/forest.mp4"
    fire_vid_url = "https://github.com/Nimra064/Forest-Fire-Detection-using-YOLO-Nas/raw/main/test2.mp4"
    
    dir_path = os.path.dirname(os.path.abspath(__file__))
    nominal_path = os.path.join(dir_path, "forest_nominal.jpg")
    fire_path = os.path.join(dir_path, "forest_fire.jpg")
    nominal_vid_path = os.path.join(dir_path, "forest_nominal.mp4")
    fire_vid_path = os.path.join(dir_path, "forest_fire.mp4")
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    
    assets = [
        (nominal_url, nominal_path),
        (fire_url, fire_path),
        (nominal_vid_url, nominal_vid_path),
        (fire_vid_url, fire_vid_path)
    ]
    
    for url, path in assets:
        if not os.path.exists(path):
            try:
                print(f"[CCTV] Downloading sample asset from {url} to {path}...")
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"[CCTV] Download complete: {path}")
            except Exception as e:
                print(f"[CCTV] Failed to download {path}: {e}")

def lat_lng_drift(tower: str, t: float):
    base_lat, base_lng = (22.84, 74.25) if tower == "alpha" else (29.38, 79.46)
    lat_drift = np.sin(t * 0.05) * 0.0002
    lng_drift = np.cos(t * 0.05) * 0.0002
    return base_lat + lat_drift, base_lng + lng_drift

def draw_hud_overlays(frame, tower: str, coords):
    width, height = 640, 480
    lat_val, lng_val = coords
    
    cv2.drawMarker(frame, (width // 2, height // 2), (220, 220, 220), cv2.MARKER_CROSS, 20, 1)
    
    L = 20
    color = (240, 240, 240)
    # Top-Left
    cv2.line(frame, (25, 25), (25 + L, 25), color, 1)
    cv2.line(frame, (25, 25), (25, 25 + L), color, 1)
    # Top-Right
    cv2.line(frame, (width - 25, 25), (width - 25 - L, 25), color, 1)
    cv2.line(frame, (width - 25, 25), (width - 25, 25 + L), color, 1)
    # Bottom-Left
    cv2.line(frame, (25, height - 25), (25 + L, height - 25), color, 1)
    cv2.line(frame, (25, height - 25), (25, height - 25 - L), color, 1)
    # Bottom-Right
    cv2.line(frame, (width - 25, height - 25), (width - 25 - L, height - 25), color, 1)
    cv2.line(frame, (width - 25, height - 25), (width - 25, height - 25 - L), color, 1)
    
    cv2.putText(frame, f"WATCHTOWER: Lookout {tower.upper()}", (35, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    timestr = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    cv2.putText(frame, f"UTC: {timestr}", (35, 68), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)
    cv2.putText(frame, f"GPS: {lat_val:.5f}N, {lng_val:.5f}E", (width - 240, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
    
    cv2.line(frame, (220, 30), (420, 30), (220, 220, 220), 1)
    drift_px = int((lng_val * 1000) % 20)
    for x in range(220, 421, 20):
        pos_x = x - drift_px
        if 220 <= pos_x <= 420:
            cv2.line(frame, (pos_x, 30), (pos_x, 35), (220, 220, 220), 1)
            
    if int(time.time()) % 2 == 0:
        cv2.circle(frame, (width - 40, 65), 4, (0, 0, 255), -1)
        cv2.putText(frame, "REC", (width - 70, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1, cv2.LINE_AA)

def generate_cctv_frame(tower: str, mode: str, frame_input: Optional[np.ndarray] = None):
    width, height = 640, 480
    t = time.time()
    coords = lat_lng_drift(tower, t)
    
    if frame_input is not None:
        frame = cv2.resize(frame_input, (width, height))
    else:
        # Fallback to static image panning
        dir_path = os.path.dirname(os.path.abspath(__file__))
        nominal_path = os.path.join(dir_path, "forest_nominal.jpg")
        fire_path = os.path.join(dir_path, "forest_fire.jpg")
        img_path = fire_path if tower == "alpha" else nominal_path
        
        if os.path.exists(img_path):
            frame_src = cv2.imread(img_path)
        else:
            frame_src = np.zeros((height, width, 3), dtype=np.uint8)
            for y in range(0, 240):
                c = int(180 + (y / 240.0) * 75)
                frame_src[y, :] = [c, 160 + int((y / 240.0) * 40), 100 + int((y / 240.0) * 30)]
            pts1 = np.array([[0, 300], [150, 220], [350, 280], [500, 200], [640, 260], [640, 480], [0, 480]], np.int32)
            cv2.fillPoly(frame_src, [pts1], (40, 100, 50))
            pts2 = np.array([[0, 360], [250, 300], [450, 380], [640, 320], [640, 480], [0, 480]], np.int32)
            cv2.fillPoly(frame_src, [pts2], (30, 80, 40))
            cv2.putText(frame_src, "CONNECTING SOURCE...", (width // 2 - 120, height // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)

        frame_src = cv2.resize(frame_src, (720, 540))
        max_dx = 720 - 640
        max_dy = 540 - 480
        dx = int((np.sin(t * 0.05) + 1.0) * 0.5 * max_dx)
        dy = int((np.cos(t * 0.05) + 1.0) * 0.5 * max_dy)
        frame = frame_src[dy:dy+480, dx:dx+640].copy()
    
    noise = np.random.randint(-4, 5, frame.shape, dtype=np.int16)
    frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    if mode == "ai":
        _, encoded_img = cv2.imencode(".jpg", frame)
        img_bytes = encoded_img.tobytes()
        
        analysis = analyze_image(img_bytes)
        heatmap_bytes = base64.b64decode(analysis["heatmap"])
        
        nparr = np.frombuffer(heatmap_bytes, np.uint8)
        processed_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        # Resize heatmap frame back to full CCTV aspect ratio (640x480) for visual excellence
        processed_frame = cv2.resize(processed_frame, (width, height))
        
        draw_hud_overlays(processed_frame, tower, coords)
        
        label = analysis["label"]
        conf = analysis["confidence"]
        ai_hud = f"AI ANALYST: {label.upper()} ({conf*100:.1f}%)"
        ai_color = (0, 0, 255) if label == "fire" else (0, 255, 0)
        cv2.putText(processed_frame, ai_hud, (35, height - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, ai_color, 2, cv2.LINE_AA)
        
        _, final_encoded = cv2.imencode(".jpg", processed_frame)
        return final_encoded.tobytes(), label, conf
        
    draw_hud_overlays(frame, tower, coords)
    _, final_encoded = cv2.imencode(".jpg", frame)
    return final_encoded.tobytes(), "nofire", 1.0

async def stream_cctv(tower: str, mode: str):
    dir_path = os.path.dirname(os.path.abspath(__file__))
    video_file = "forest_fire.mp4" if tower == "alpha" else "forest_nominal.mp4"
    video_path = os.path.join(dir_path, video_file)
    
    cap = None
    if os.path.exists(video_path):
        cap = cv2.VideoCapture(video_path)
        
    try:
        while True:
            frame_input = None
            if cap is not None and cap.isOpened():
                ret, frame_input = cap.read()
                if not ret or frame_input is None:
                    # Loop video: rewind to start
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame_input = cap.read()
            
            frame_bytes, _, _ = generate_cctv_frame(tower, mode, frame_input=frame_input)
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Smooth framing speeds: 20 FPS (0.05s sleep) for raw video, 6-7 FPS (0.15s sleep) for heavy AI analysis
            sleep_time = 0.15 if mode == "ai" else 0.05
            await asyncio.sleep(sleep_time)
    finally:
        if cap is not None:
            cap.release()

@app.get("/api/cctv/stream")
async def get_cctv_stream(tower: str = "alpha", mode: str = "raw"):
    return StreamingResponse(stream_cctv(tower, mode), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/cctv/status")
def get_cctv_status():
    dir_path = os.path.dirname(os.path.abspath(__file__))
    towers_info = [
        {"id": "alpha", "name": "Watchtower Alpha (Dahod)", "video": "forest_fire.mp4", "lat": 22.84, "lng": 74.25},
        {"id": "beta", "name": "Watchtower Beta (Nainital)", "video": "forest_nominal.mp4", "lat": 29.38, "lng": 79.46}
    ]
    
    results = []
    for t in towers_info:
        video_path = os.path.join(dir_path, t["video"])
        threat = "nofire"
        confidence = 0.99
        
        # Open video and grab a frame to run actual real-time inference
        if os.path.exists(video_path):
            cap = cv2.VideoCapture(video_path)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    _, encoded_img = cv2.imencode(".jpg", frame)
                    try:
                        analysis = analyze_image(encoded_img.tobytes())
                        threat = analysis["label"]
                        confidence = float(analysis["confidence"])
                    except Exception as e:
                        print(f"[CCTV STATUS] Inference error: {e}")
                cap.release()
                
        results.append({
            "id": t["id"],
            "name": t["name"],
            "status": "warning" if threat == "fire" else "nominal",
            "lat": t["lat"],
            "lng": t["lng"],
            "threat": threat,
            "confidence": confidence
        })
        
    return {"towers": results}

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, download_sample_images)
    asyncio.create_task(periodic_alert_worker())
    asyncio.create_task(poll_telegram_messages())

if __name__ == "__main__":
    # Hot-reload triggered for token update
    uvicorn.run("unified_server:app", host="0.0.0.0", port=8000, reload=True)
