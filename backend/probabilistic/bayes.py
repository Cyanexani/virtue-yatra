from typing import Dict

class BayesianRiskAnalyzer:
    def __init__(self):
        # Simplified hardcoded CPTs for demonstration
        self.weather_prior = {"Sunny": 0.6, "Rainy": 0.4}
        # P(Crowd | Weather)
        self.crowd_given_weather = {
            "Sunny": {"High": 0.8, "Low": 0.2},
            "Rainy": {"High": 0.3, "Low": 0.7}
        }
        
    def infer_risk(self, destination: str, current_weather: str = None) -> Dict[str, float]:
        """Returns the probability distribution of crowd level and overall destination risk."""
        if current_weather is None:
            # Marginalize weather
            p_high_crowd = (self.weather_prior["Sunny"] * self.crowd_given_weather["Sunny"]["High"] + 
                            self.weather_prior["Rainy"] * self.crowd_given_weather["Rainy"]["High"])
            p_low_crowd = 1.0 - p_high_crowd
            return {"High_Crowd": p_high_crowd, "Low_Crowd": p_low_crowd}
        else:
            p_high = self.crowd_given_weather.get(current_weather, {"High": 0.5, "Low": 0.5})["High"]
            p_low = self.crowd_given_weather.get(current_weather, {"High": 0.5, "Low": 0.5})["Low"]
            return {"High_Crowd": p_high, "Low_Crowd": p_low}

    def adjust_score(self, base_score: float, current_weather: str) -> float:
        risk = self.infer_risk("any", current_weather)
        # Penalize if high crowd probability is high
        penalty = risk.get("High_Crowd", 0.5) * 10
        # Penalize if rainy
        weather_penalty = 15 if current_weather == "Rainy" else 0
        return max(0, base_score - penalty - weather_penalty)
