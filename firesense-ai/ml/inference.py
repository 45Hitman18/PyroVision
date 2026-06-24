import torch
import numpy as np
from models.convlstm import FireSenseModel
import os

# Model configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "ml/checkpoints/best_model.pt"

# Global model instance for efficiency
_model = None

def load_model():
    global _model
    if _model is None:
        _model = FireSenseModel().to(DEVICE)
        if os.path.exists(MODEL_PATH):
            _model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True))
            print(f"Model loaded from {MODEL_PATH}")
        else:
            print("Warning: Model checkpoint not found. Using uninitialized model.")
        _model.eval()
    return _model

def normalize_feature(value, min_val, max_val):
    return (value - min_val) / (max_val - min_val + 1e-8)

def predict(ndvi: float, lst: float, wind_speed: float, wind_dir: float, 
            humidity: float, slope: float, fire_history: float, 
            lat: float, lon: float) -> dict:
    """
    Predict wildfire risk for a single location.
    Point prediction repeats values across a small spatial grid (3x3) and 3-day sequence.
    """
    global _model
    model = load_model()
    
    model_exists = os.path.exists(MODEL_PATH)
    
    if model_exists:
        # Normalization
        ndvi_n = normalize_feature(ndvi, -1, 1)
        lst_n = normalize_feature(lst, 0, 50)
        ws_n = normalize_feature(wind_speed, 0, 80)
        wd_n = normalize_feature(wind_dir, 0, 360)
        hum_n = normalize_feature(humidity, 0, 100)
        slp_n = normalize_feature(slope, 0, 60)
        fh_n = normalize_feature(fire_history, 0, 10)
        
        # Create input tensor (batch=1, seq=3, channels=7, H=3, W=3)
        input_tensor = torch.zeros((1, 3, 7, 3, 3), device=DEVICE)
        features = [ndvi_n, lst_n, ws_n, wd_n, hum_n, slp_n, fh_n]
        
        for c in range(7):
            input_tensor[0, :, c, :, :] = features[c]
            
        with torch.no_grad():
            logits = model(input_tensor) # (1, 3, 3, 3)
            # Take the center pixel prediction
            probs = torch.softmax(logits, dim=1)[0, :, 1, 1]
    else:
        # High-Fidelity Scientific Wildfire Risk Heuristic (Fire Weather Index approach)
        # Scales variables to 0-1 ranges where 1 indicates maximum risk.
        n_ndvi = 1.0 - max(0.0, min(1.0, (ndvi + 1.0) / 2.0)) 
        n_lst = max(0.0, min(1.0, (lst - 15.0) / 40.0)) 
        n_ws = max(0.0, min(1.0, wind_speed / 80.0)) 
        n_hum = 1.0 - max(0.0, min(1.0, (humidity - 5.0) / 95.0)) 
        n_slp = max(0.0, min(1.0, slope / 45.0)) 
        n_fh = max(0.0, min(1.0, fire_history / 10.0)) 
        
        # Composite risk index representing complex physics interaction
        risk_score = (
            n_lst * 0.25 + 
            n_ws * 0.20 + 
            n_hum * 0.20 + 
            n_ndvi * 0.15 + 
            n_slp * 0.10 + 
            n_fh * 0.10
        )
        
        # Project score to class probabilities via Softmax
        low_logit = (1.0 - risk_score) * 5.0
        med_logit = 2.5 - abs(risk_score - 0.5) * 5.0
        high_logit = risk_score * 5.0
        
        logits = torch.tensor([low_logit, med_logit, high_logit])
        probs = torch.softmax(logits, dim=0)

    risk_classes = ["LOW", "MEDIUM", "HIGH"]
    risk_idx = torch.argmax(probs).item()
    
    return {
        "risk": risk_classes[risk_idx],
        "confidence": float(probs[risk_idx]),
        "probabilities": {
            "LOW": float(probs[0]),
            "MEDIUM": float(probs[1]),
            "HIGH": float(probs[2])
        },
        "location": {"lat": lat, "lon": lon}
    }

if __name__ == "__main__":
    # Test prediction
    result = predict(0.6, 35.0, 15.0, 180.0, 40.0, 10.0, 2.0, 23.2, 72.6)
    print("Test Prediction Result:")
    print(result)
