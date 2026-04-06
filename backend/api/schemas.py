from pydantic import BaseModel, Field
from typing import Dict

class AsteroidPhysicalData(BaseModel):
    diameter_km: float = Field(..., gt=0, description="Asteroid diameter in kilometers")
    H: float = Field(..., description="Absolute magnitude (H)")
    albedo: float = Field(..., description="Geometric albedo")
    e: float = Field(..., description="Eccentricity")
    a: float = Field(..., description="Semi-major axis (au)")
    q: float = Field(..., description="Perihelion distance (au)")
    i: float = Field(..., description="Inclination (deg)")

class MaterialValuation(BaseModel):
    mass_kg: float
    estimated_value_usd: float

class PredictionResponse(BaseModel):
    predicted_class: str = Field(..., description="Predicted spectral macro-class (C, S, M)")
    total_mass_kg: float = Field(..., description="Estimated total mass in kg")
    total_value_usd: float = Field(..., description="Total estimated market value in USD")
    materials_breakdown: Dict[str, MaterialValuation]
