import os
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")

CNEOS_API_URL = "https://ssd-api.jpl.nasa.gov/cad.api"
SBDB_API_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"

def fetch_neo_close_approaches(date_min="2026-04-01", date_max="2026-04-30", dist_max="0.05"):
    """
    Fetch NEO close approach data from NASA CNEOS API.
    """
    params = {
        "date-min": date_min,
        "date-max": date_max,
        "dist-max": dist_max
    }
    
    response = requests.get(CNEOS_API_URL, params=params)
    response.raise_for_status()
    
    data = response.json()
    if int(data.get("count", 0)) > 0:
        df = pd.DataFrame(data["data"], columns=data["fields"])
        return df
    return pd.DataFrame()

def fetch_asteroid_physical_data(des):
    """
    Fetch physical properties of an asteroid using SBDB API.
    """
    params = {
        "sstr": des,
        "phys-par": "1" # Request physical properties
    }
    
    response = requests.get(SBDB_API_URL, params=params)
    if response.status_code == 200:
        return response.json()
    return None

if __name__ == "__main__":
    print("Testing data acquisition from NASA CNEOS...")
    df_cad = fetch_neo_close_approaches(date_min="2026-04-01", date_max="2026-04-07")
    
    if not df_cad.empty:
        print(f"Successfully fetched {len(df_cad)} close approaches.")
        print(df_cad.head())
        
        # Save to csv for inspection
        os.makedirs("../data", exist_ok=True)
        df_cad.to_csv("../data/sample_cad.csv", index=False)
        print("Saved to ../data/sample_cad.csv")
        
        # Test pulling physical data for the first item
        first_des = df_cad.iloc[0]["des"]
        print(f"\nFetching physical data for {first_des}...")
        phys_data = fetch_asteroid_physical_data(first_des)
        
        if phys_data and "phys_par" in phys_data:
            print("Successfully retrieved physical data.")
        else:
            print("No physical parameters found or request failed.")
    else:
        print("No data found or request failed.")
