import os
import glob
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
import torch
from torch.utils.data import DataLoader, TensorDataset
from tqdm import tqdm
import pandas as pd

# Constants
RAW_DIR = "ml/data/raw"
PROCESSED_DIR = "ml/data/processed"
RESOLUTION = 0.00449157 # Approx 500m in degrees
BBOXES = {
    "Gujarat": [68.1, 20.1, 74.5, 24.7],
    "Uttarakhand": [77.5, 29.5, 81.0, 31.5]
}

def align_rasters(src_path, dst_path, target_bbox):
    """Reproject and align rasters to a common grid."""
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, 'EPSG:4326', src.width, src.height, *src.bounds)
        kwargs = src.meta.copy()
        kwargs.update({
            'crs': 'EPSG:4326',
            'transform': transform,
            'width': width,
            'height': height
        })

        with rasterio.open(dst_path, 'w', **kwargs) as dst:
            for i in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, i),
                    destination=rasterio.band(dst, i),
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs='EPSG:4326',
                    resampling=Resampling.bilinear)

def normalize(data, min_val, max_val):
    """Min-Max normalization."""
    return (data - min_val) / (max_val - min_val + 1e-8)

def create_sequences(data, labels, seq_length=3):
    """Create temporal sequences of shape (N, seq_len, channels, H, W)."""
    sequences = []
    target_labels = []
    for i in range(len(data) - seq_length + 1):
        sequences.append(data[i:i+seq_length])
        target_labels.append(labels[i+seq_length-1]) # Label of the last day in sequence
    return np.array(sequences), np.array(target_labels)

def get_risk_class(fire_density):
    """Convert fire density to 3-class risk."""
    if fire_density == 0:
        return 0 # LOW
    elif fire_density <= 2:
        return 1 # MEDIUM
    else:
        return 2 # HIGH

def preprocess_main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    # Placeholder for actual data loading logic
    # In a real scenario, we'd iterate over dates and regions
    print("Starting preprocessing...")
    
    # Mock data generation for demonstration of the pipeline structure
    # since actual GeoTIFFs are not present yet.
    num_days = 100
    H, W = 128, 128 # Example dimensions
    
    all_features = []
    all_labels = []
    
    for day in range(num_days):
        # 7 features: NDVI, LST, WindSpeed, WindDir, Humidity, Slope, FireHistory
        ndvi = np.random.uniform(-0.2, 0.8, (H, W))
        lst = np.random.uniform(290, 320, (H, W)) - 273.15 # Kelvin to Celsius
        wind_speed = np.random.uniform(0, 40, (H, W))
        wind_dir = np.random.uniform(0, 360, (H, W))
        humidity = np.random.uniform(10, 90, (H, W))
        slope = np.random.uniform(0, 45, (H, W))
        fire_hist = np.random.uniform(0, 5, (H, W))
        
        # Normalization
        ndvi_norm = normalize(ndvi, -1, 1)
        lst_norm = normalize(lst, 0, 50)
        wind_norm = normalize(wind_speed, 0, 80)
        hum_norm = normalize(humidity, 0, 100)
        slope_norm = normalize(slope, 0, 60)
        fire_norm = normalize(fire_hist, 0, 10)
        
        day_features = np.stack([ndvi_norm, lst_norm, wind_norm, wind_norm, hum_norm, slope_norm, fire_norm], axis=0)
        all_features.append(day_features)
        
        # Generate target: Fire density (0, 1, 2+)
        fire_density = np.random.poisson(0.1, (H, W))
        risk_map = np.vectorize(get_risk_class)(fire_density)
        all_labels.append(risk_map)

    all_features = np.array(all_features) # (D, 7, H, W)
    all_labels = np.array(all_labels)     # (D, H, W)
    
    X, y = create_sequences(all_features, all_labels)
    
    # Split by date (70/15/15)
    n = len(X)
    train_idx = int(n * 0.7)
    val_idx = int(n * 0.85)
    
    X_train, y_train = X[:train_idx], y[:train_idx]
    X_val, y_val = X[train_idx:val_idx], y[train_idx:val_idx]
    X_test, y_test = X[val_idx:], y[val_idx:]
    
    # Save as .pt
    torch.save((torch.tensor(X_train).float(), torch.tensor(y_train).long()), f"{PROCESSED_DIR}/train.pt")
    torch.save((torch.tensor(X_val).float(), torch.tensor(y_val).long()), f"{PROCESSED_DIR}/val.pt")
    torch.save((torch.tensor(X_test).float(), torch.tensor(y_test).long()), f"{PROCESSED_DIR}/test.pt")
    
    print(f"Dataset Statistics:")
    print(f"Train sequences: {len(X_train)}, Shape: {X_train.shape}")
    print(f"Val sequences: {len(X_val)}")
    print(f"Test sequences: {len(X_test)}")
    
    # Class distribution
    unique, counts = np.unique(y_train, return_counts=True)
    dist = dict(zip(unique, counts))
    print(f"Class distribution in Train: {dist}")

if __name__ == "__main__":
    preprocess_main()
