import os
import json
import httpx
import logging
from typing import Dict, Any, Optional

try:
    import redis
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    # Test connection
    redis_client.ping()
    HAS_REDIS = True
except Exception as e:
    logging.warning(f"Redis not available, using in-memory cache. Reason: {e}")
    HAS_REDIS = False
    _memory_cache = {}

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
CNEOS_API_URL = "https://ssd-api.jpl.nasa.gov/cad.api"
SBDB_API_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"

async def _fetch_with_cache(url: str, params: dict, ttl_seconds: int = 86400) -> Optional[Dict[str, Any]]:
    # Create deterministic cache key
    cache_key = f"{url}?{json.dumps(params, sort_keys=True)}"
    
    # Check cache
    if HAS_REDIS:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    else:
        # Simple memory cache without TTL enforcement for local dev
        if cache_key in _memory_cache:
            return _memory_cache[cache_key]
            
    # Fetch if not cached
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Save to cache
            if HAS_REDIS:
                redis_client.setex(cache_key, ttl_seconds, json.dumps(data))
            else:
                _memory_cache[cache_key] = data
                
            return data
        except Exception as e:
            logging.error(f"NASA API call failed: {e}")
            return None

async def get_upcoming_close_approaches(date_min: str, date_max: str, dist_max: str = "0.05"):
    params = {
        "date-min": date_min,
        "date-max": date_max,
        "dist-max": dist_max
    }
    return await _fetch_with_cache(CNEOS_API_URL, params, ttl_seconds=43200) # 12 hr cache

import asyncio

async def get_upcoming_with_elements(date_min: str, date_max: str, dist_max: str = "0.05", limit: int = 15):
    upcoming = await get_upcoming_close_approaches(date_min, date_max, dist_max)
    if not upcoming or "data" not in upcoming:
        return upcoming
        
    fields = upcoming.get("fields", [])
    try:
        des_idx = fields.index("des")
    except ValueError:
        des_idx = 0

    limited_data = upcoming["data"][:limit]
    
    sem = asyncio.Semaphore(5)
    
    async def fetch_elements(row):
        des = row[des_idx]
        async with sem:
            sbdb_data = await get_asteroid_physical_data(des)
            row_dict = {fields[i]: v for i, v in enumerate(row)}
            
            if sbdb_data and "orbit" in sbdb_data:
                orbit = sbdb_data["orbit"]
                row_dict["epoch"] = float(orbit.get("epoch", 0))
                
                if "elements" in orbit:
                    elements_dict = { e["name"]: float(e["value"]) for e in orbit["elements"] }
                    row_dict["a"] = elements_dict.get("a", 1.0)
                    row_dict["e"] = elements_dict.get("e", 0.0)
                    row_dict["i"] = elements_dict.get("i", 0.0)
                    row_dict["om"] = elements_dict.get("node", 0.0)
                    row_dict["w"] = elements_dict.get("peri", 0.0)
                    row_dict["ma"] = elements_dict.get("ma", elements_dict.get("M", 0.0))
            
            return row_dict

    augmented_data = await asyncio.gather(*(fetch_elements(row) for row in limited_data))
    
    # Return augmenting response replacing the "data" array with objects
    return {
        "signature": upcoming.get("signature"),
        "count": len(augmented_data),
        "data": augmented_data
    }

async def get_asteroid_physical_data(des: str):
    params = {
        "sstr": des,
        "phys-par": "1"
    }
    return await _fetch_with_cache(SBDB_API_URL, params, ttl_seconds=2592000) # 30 day cache
