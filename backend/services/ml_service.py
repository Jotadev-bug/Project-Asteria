import os
import joblib
import pandas as pd
from typing import Dict, Any

from backend.api.schemas import AsteroidPhysicalData
import sys

# Ensure ml_pipeline is in the python path for importing
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from ml_pipeline.valuation_engine import evaluate_asteroid_value

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "asteroid_classifier.joblib")
_classifier = None

def load_model():
    global _classifier
    if os.path.exists(MODEL_PATH):
        _classifier = joblib.load(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}")

def predict_composition_and_value(data: AsteroidPhysicalData) -> Dict[str, Any]:
    if _classifier is None:
        raise RuntimeError("ML Model is not loaded. Cannot perform prediction.")
        
    # Format data for prediction
    # Features must match training: ['H', 'albedo', 'e', 'a', 'q', 'i']
    input_df = pd.DataFrame([{
        'H': data.H,
        'albedo': data.albedo,
        'e': data.e,
        'a': data.a,
        'q': data.q,
        'i': data.i
    }])
    
    # Predict macro class (C, S, M)
    predicted_class = _classifier.predict(input_df)[0]
    
    # Evaluate estimated mass and dollar value
    valuation = evaluate_asteroid_value(data.diameter_km, predicted_class)
    
    response = {
        "predicted_class": predicted_class,
        "total_mass_kg": valuation["total_mass_kg"],
        "total_value_usd": valuation["total_value_usd"],
        "materials_breakdown": valuation["materials_breakdown"]
    }
    
    return response
