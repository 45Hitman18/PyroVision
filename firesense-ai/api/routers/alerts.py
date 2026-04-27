from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
import json
import os
import re
from typing import List

router = APIRouter()
DATA_PATH = "data/subscriptions.json"

class SubscriptionRequest(BaseModel):
    phone: str
    lat: float
    lng: float
    threshold: str # LOW, MEDIUM, HIGH

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        # Valid Indian mobile: 10 digits starting with 6-9, or +91 prefix
        pattern = r"^(?:\+91|0)?[6-9]\d{9}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid Indian mobile number format")
        return v

@router.post("/subscribe")
async def subscribe(request: SubscriptionRequest):
    # Ensure data dir exists
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    
    subscriptions = []
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r") as f:
                subscriptions = json.load(f)
        except:
            subscriptions = []
            
    # Check if already exists
    if any(s["phone"] == request.phone for s in subscriptions):
        # Update existing
        for s in subscriptions:
            if s["phone"] == request.phone:
                s.update(request.model_dump())
    else:
        subscriptions.append(request.model_dump())
        
    with open(DATA_PATH, "w") as f:
        json.dump(subscriptions, f, indent=4)
        
    masked_phone = re.sub(r"\d(?=\d{4})", "*", request.phone)
    
    return {
        "subscribed": True,
        "phone_masked": masked_phone,
        "nearest_zone": "Dynamic Sector Alpha"
    }

@router.get("/subscriptions/count")
async def get_subscriber_count():
    if not os.path.exists(DATA_PATH):
        return {"total_subscribers": 0}
    try:
        with open(DATA_PATH, "r") as f:
            data = json.load(f)
            return {"total_subscribers": len(data)}
    except:
        return {"total_subscribers": 0}
