from typing import Dict

def calculate_utility(destination: Dict, preferences: Dict[str, float], cost: float) -> float:
    """
    Utility = (sum of preference * destination_score for that preference) - cost_penalty
    """
    score = 0.0
    
    dest_attributes = destination.get("attributes", {"Adventure": 0.5, "Luxury": 0.5, "Culture": 0.5})
    
    for pref_key, weight in preferences.items():
        score += weight * dest_attributes.get(pref_key, 0.0)
        
    # Cost penalty (assuming budget is normalized around 10000)
    cost_penalty = (cost / 10000.0) * 0.2
    
    return score - cost_penalty
