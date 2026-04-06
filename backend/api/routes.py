from fastapi import APIRouter, HTTPException
from backend.api.schemas import AsteroidPhysicalData, PredictionResponse
from backend.services.nasa_service import get_upcoming_with_elements, get_asteroid_physical_data
from backend.services.ml_service import predict_composition_and_value
import logging

router = APIRouter()

@router.get("/neo/upcoming")
async def upcoming_neos(date_min: str, date_max: str, dist_max: str = "0.05"):
    data = await get_upcoming_with_elements(date_min, date_max, dist_max)
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch upcoming approaches from NASA API.")
    return data

@router.get("/neo/{des}")
async def specific_neo(des: str):
    data = await get_asteroid_physical_data(des)
    if not data:
        raise HTTPException(status_code=404, detail=f"Asteroid designation '{des}' not found.")
    return data

@router.post("/predict/value", response_model=PredictionResponse)
async def predict_value(data: AsteroidPhysicalData):
    try:
        result = predict_composition_and_value(data)
        return result
    except RuntimeError as e:
        logging.error(f"Prediction model error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logging.error(f"Prediction failure: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
