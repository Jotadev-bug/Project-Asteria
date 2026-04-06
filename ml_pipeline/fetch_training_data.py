import os
import requests
import json
import pandas as pd
import numpy as np

SBDB_QUERY_API = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"

def fetch_sbdb_batch():
    """
    Fetch asteroids with defined spectral types from NASA SBDB.
    """
    print("Querying NASA SBDB for asteroids with defined spectral types...")
    
    # The NASA API sbdb_query.api doesn't support 'DEF' for spec_B constraint.
    # Instead, we query bright asteroids (H < 15) which usually have known spectral types.
    query = {
        "AND": [
            "H|LT|15"
        ]
    }
    
    params = {
        "fields": "full_name,H,albedo,diameter,e,a,q,i,spec_B,spec_T",
        "sb-kind": "a",
        "sb-cdata": json.dumps(query)
    }
    
    response = requests.get(SBDB_QUERY_API, params=params)
    response.raise_for_status()
    data = response.json()
    
    if "data" in data and "fields" in data:
        df = pd.DataFrame(data["data"], columns=data["fields"])
        return df
    return pd.DataFrame()

def map_macro_class(spec_str):
    """
    Map Tholen or SMASS spectral class to a macro category: C, S, M.
    Returns None if it doesn't clearly map or is unknown.
    """
    if pd.isna(spec_str) or not spec_str:
        return None
        
    spec_str = str(spec_str).upper()
    
    if spec_str.startswith('C') or spec_str in ['B', 'F', 'G']:
        return 'C'
    elif spec_str.startswith('S') or spec_str in ['A', 'Q', 'R', 'K', 'L']:
        return 'S'
    elif spec_str.startswith('M') or spec_str.startswith('X') or spec_str in ['E', 'P']:
        return 'M' 
    elif spec_str.startswith('D') or spec_str.startswith('T'):
        return 'C' 
        
    return 'Other'

def clean_and_map_data(df):
    """
    Clean the dataset and map spectral classes.
    """
    print(f"Total raw records fetched: {len(df)}")
    
    # Combine spec_B and spec_T. Prefer SMASS (spec_B) if both exist.
    df['spectral_class'] = df['spec_B'].fillna(df['spec_T'])
    
    # Drop rows without any spectral classification and create an explicit copy
    df = df.dropna(subset=['spectral_class']).copy()
    
    # Convert numerical columns to float
    num_cols = ['H', 'albedo', 'diameter', 'e', 'a', 'q', 'i']
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Drop rows missing critical physical data (H)
    df = df.dropna(subset=['H'])
    
    # Vectorized macro group mapping
    df['target_class'] = df['spectral_class'].apply(map_macro_class)
    
    # Keep only target classes C, S, M
    valid_classes = ['C', 'S', 'M']
    df = df[df['target_class'].isin(valid_classes)]
    
    # Drop rows with missing albedo since it's highly predictive
    df = df.dropna(subset=['albedo'])
    
    print(f"Cleaned records eligible for training: {len(df)}")
    print("Class distribution:")
    print(df['target_class'].value_counts())
    
    return df

if __name__ == "__main__":
    df_raw = fetch_sbdb_batch()
    if not df_raw.empty:
        df_clean = clean_and_map_data(df_raw)
        
        output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, "training_dataset.csv")
        
        df_clean.to_csv(out_path, index=False)
        print(f"Training dataset saved to {out_path}")
    else:
        print("Failed to fetch data or no data matched.")
