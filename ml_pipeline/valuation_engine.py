import math

# Baseline estimated densities in kg/m^3
DENSITY_MAP = {
    'C': 1380,  # Carbonaceous 
    'S': 2710,  # Stony
    'M': 5320,  # Metallic
    'Other': 2000
}

# Assumed mass fraction of valuable materials per macro-class
# This is a simplified heuristic model for valuation
COMPOSITION_FRACTIONS = {
    'C': {'water': 0.10, 'iron_nickel': 0.05},
    'S': {'iron_nickel': 0.15, 'platinum_group': 0.000001},
    'M': {'iron_nickel': 0.85, 'platinum_group': 0.000015, 'gold': 0.000002}
}

def estimate_asteroid_mass(diameter_km: float, spectral_class: str) -> float:
    """
    Estimate the mass of an asteroid in kg based on its diameter and spectral class.
    """
    if not diameter_km or diameter_km <= 0:
        return 0.0
        
    density_kg_m3 = DENSITY_MAP.get(spectral_class, DENSITY_MAP['Other'])
    radius_m = (diameter_km * 1000) / 2.0
    
    # Volume of a sphere
    volume_m3 = (4.0 / 3.0) * math.pi * (radius_m ** 3)
    
    mass_kg = volume_m3 * density_kg_m3
    return mass_kg

def evaluate_asteroid_value(diameter_km: float, spectral_class: str, current_prices: dict = None) -> dict:
    """
    Calculate the estimated market value of an asteroid in USD.
    
    current_prices structure example (prices in USD per kg):
    {
        'iron_nickel': 0.10, # Iron ore is cheap!
        'platinum_group': 30000.0, # Platinum is roughly $30k/kg
        'gold': 75000.0, # Gold is roughly $75k/kg
        'water': 1.0 # In-space water value
    }
    """
    if current_prices is None:
        # Fallback to static estimated prices if APIs fail
        current_prices = {
            'iron_nickel': 0.10,
            'platinum_group': 30000.0,
            'gold': 75000.0,
            'water': 1.0
        }
        
    mass_kg = estimate_asteroid_mass(diameter_km, spectral_class)
    fractions = COMPOSITION_FRACTIONS.get(spectral_class, {})
    
    total_value_usd = 0.0
    breakdown = {}
    
    for material, fraction in fractions.items():
        material_mass = mass_kg * fraction
        price_per_kg = current_prices.get(material, 0.0)
        value = material_mass * price_per_kg
        
        total_value_usd += value
        breakdown[material] = {
            'mass_kg': material_mass,
            'estimated_value_usd': value
        }
        
    return {
        'total_mass_kg': mass_kg,
        'total_value_usd': total_value_usd,
        'materials_breakdown': breakdown
    }

if __name__ == "__main__":
    # Test the valuation engine
    test_diameter = 1.5 # 1.5 km asteroid
    test_class = 'M'
    
    result = evaluate_asteroid_value(test_diameter, test_class)
    print(f"Asteroid Valuation Test (Diameter: {test_diameter}km, Class: {test_class})")
    print(f"Total Mass: {result['total_mass_kg']:.2e} kg")
    print(f"Total Value: ${result['total_value_usd']:,.2f}")
    print("Breakdown:")
    for mat, data in result['materials_breakdown'].items():
        print(f"  - {mat.capitalize()}: ${data['estimated_value_usd']:,.2f} ({data['mass_kg']:.2e} kg)")
