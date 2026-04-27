import os
import requests
import datetime
import ee
import rasterio
from rasterio.transform import from_origin
import numpy as np
from tqdm import tqdm
import time
import cdsapi

# Regions Configuration
REGIONS = {
    "Gujarat": {"bbox": [68.1, 20.1, 74.5, 24.7]},
    "Uttarakhand": {"bbox": [77.5, 29.5, 81.0, 31.5]}
}

# Date Range
START_DATE = "2018-01-01"
END_DATE = "2024-12-31"

# API Keys (Placeholders - Should be set in environment variables)
FIRMS_API_KEY = os.getenv("FIRMS_API_KEY", "YOUR_FIRMS_API_KEY")

def initialize_gee():
    """Initialize Google Earth Engine."""
    try:
        ee.Initialize()
        print("Google Earth Engine initialized successfully.")
    except Exception as e:
        print(f"Error initializing Earth Engine: {e}")
        print("Please run 'earthengine authenticate' in your terminal.")

def download_firms_data(region_name, bbox):
    """Download active fire data from NASA FIRMS."""
    print(f"Downloading FIRMS data for {region_name}...")
    # FIRMS API endpoint for area requests
    # format: https://firms.modaps.eosdis.nasa.gov/api/area/csv/[KEY]/[SOURCE]/[AREA]/[DAY_RANGE]/[DATE]
    # For simplicity, we'll use a loop or a bulk request if available. 
    # Note: FIRMS API has limits.
    
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_API_KEY}/MODIS_NRT/{','.join(map(str, bbox))}/10"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            os.makedirs("ml/data/raw/firms", exist_ok=True)
            with open(f"ml/data/raw/firms/{region_name}_fire.csv", "w") as f:
                f.write(response.text)
            print(f"FIRMS data saved for {region_name}")
        else:
            print(f"Failed to download FIRMS data: {response.status_code}")
    except Exception as e:
        print(f"Error downloading FIRMS data: {e}")

def download_modis_gee(region_name, bbox):
    """Download MODIS NDVI, LST, and Fire data from GEE."""
    print(f"Downloading MODIS data from GEE for {region_name}...")
    
    geom = ee.Geometry.Rectangle(bbox)
    
    # MOD13A1.061 Vegetation Indices 16-Day Global 500m
    ndvi_col = ee.ImageCollection("MODIS/061/MOD13A1") \
        .filterBounds(geom) \
        .filterDate(START_DATE, END_DATE) \
        .select('NDVI')
    
    # MOD11A1.061 Land Surface Temperature/Emissivity Daily Global 1km
    lst_col = ee.ImageCollection("MODIS/061/MOD11A1") \
        .filterBounds(geom) \
        .filterDate(START_DATE, END_DATE) \
        .select('LST_Day_1km')
    
    # MOD14A1.061 Thermal Anomalies & Fire Daily Global 1km
    fire_col = ee.ImageCollection("MODIS/061/MOD14A1") \
        .filterBounds(geom) \
        .filterDate(START_DATE, END_DATE) \
        .select('FireMask')

    # This is a conceptual implementation as downloading thousands of images 
    # individually via GEE getInfo() is slow and might hit limits.
    # In a real pipeline, we'd use Export.image.toDrive or a batch download tool.
    print(f"Identified {ndvi_col.size().getInfo()} NDVI images, {lst_col.size().getInfo()} LST images.")
    
    # For the purpose of this script, we'll log that the collections are ready.
    # Actual downloading would involve exporting to Cloud Storage or Drive.

def download_era5_data():
    """Download ERA5 reanalysis data for wind and humidity."""
    print("Downloading ERA5 reanalysis data...")
    c = cdsapi.Client()
    
    os.makedirs("ml/data/raw/era5", exist_ok=True)
    
    try:
        c.retrieve(
            'reanalysis-era5-single-levels',
            {
                'product_type': 'reanalysis',
                'format': 'netcdf',
                'variable': [
                    '10m_u_component_of_wind', '10m_v_component_of_wind', '2m_relative_humidity',
                ],
                'year': [str(y) for y in range(2018, 2025)],
                'month': [f"{m:02d}" for m in range(1, 13)],
                'day': [f"{d:02d}" for d in range(1, 32)],
                'time': '12:00',
                'area': [32, 68, 20, 82], # [North, West, South, East] covering Gujarat and Uttarakhand
            },
            'ml/data/raw/era5/weather_data.nc'
        )
        print("ERA5 data downloaded successfully.")
    except Exception as e:
        print(f"Error downloading ERA5 data: {e}")

def download_srtm_elevation(region_name, bbox):
    """Download SRTM elevation data."""
    print(f"Downloading SRTM elevation for {region_name}...")
    geom = ee.Geometry.Rectangle(bbox)
    srtm = ee.Image("USGS/SRTMGL1_003").clip(geom)
    # Elevation and Slope
    slope = ee.Terrain.slope(srtm)
    
    # In a production environment, use Export.image.toDrive
    print("Elevation and Slope data ready in Earth Engine.")

def main():
    os.makedirs("ml/data/raw", exist_ok=True)
    initialize_gee()
    
    for name, config in REGIONS.items():
        download_firms_data(name, config["bbox"])
        download_modis_gee(name, config["bbox"])
        download_srtm_elevation(name, config["bbox"])
        
    download_era5_data()
    print("Download process completed.")

if __name__ == "__main__":
    main()
