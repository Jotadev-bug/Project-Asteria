const API_BASE = "http://localhost:8000/api";

export interface PredictionRequest {
  diameter_km: number;
  H: number;
  albedo: number;
  e: number;
  a: number;
  q: number;
  i: number;
}

export interface MaterialValuation {
  mass_kg: number;
  estimated_value_usd: number;
}

export interface PredictionResponse {
  predicted_class: string;
  total_mass_kg: number;
  total_value_usd: number;
  materials_breakdown: Record<string, MaterialValuation>;
}

export async function fetchUpcomingNEOs(dateMin: string, dateMax: string) {
  const url = `${API_BASE}/neo/upcoming?date_min=${dateMin}&date_max=${dateMax}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch upcoming NEOs");
  return res.json();
}

export async function predictValuation(payload: PredictionRequest): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/predict/value`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    let errorDetail = "Prediction failed";
    try {
      const errData = await res.json();
      if (errData.detail) errorDetail = errData.detail;
    } catch(e) {}
    throw new Error(errorDetail);
  }
  
  return res.json();
}
