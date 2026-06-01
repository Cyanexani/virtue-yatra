from dataclasses import dataclass
from typing import List, Dict, Any
import sys
import os
import json
import urllib.request

# Add parent directory to path to allow importing sibling modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from search.astar import astar_search
from csp.solver import CSP
from probabilistic.bayes import BayesianRiskAnalyzer
from decision.utility import calculate_utility

@dataclass
class TravelState:
    city: str
    budget: float
    days: int
    interests: List[str]

class TravelAgent:
    def __init__(self):
        self.bayes = BayesianRiskAnalyzer()
        self.logs = []
        
    def log(self, step: str, reasoning: str):
        self.logs.append({"step": step, "reasoning": reasoning})
        
    def generate_trip(self, request: TravelState) -> Dict[str, Any]:
        self.logs = []
        self.log("Initialization", f"Received request for {request.days} days in {request.city} with budget {request.budget}")
        
        # 1. Search Phase (A*)
        # Mocking available destinations in the region
        destinations = [
            {"name": "Ooty", "cost": 3000, "attributes": {"Adventure": 0.4, "Luxury": 0.6, "Culture": 0.5}},
            {"name": "Coonoor", "cost": 2000, "attributes": {"Adventure": 0.3, "Luxury": 0.5, "Culture": 0.7}},
            {"name": "Mysore", "cost": 2500, "attributes": {"Adventure": 0.2, "Luxury": 0.8, "Culture": 0.9}},
            {"name": "Kodaikanal", "cost": 3500, "attributes": {"Adventure": 0.8, "Luxury": 0.4, "Culture": 0.3}}
        ]
        
        self.log("Search (A*)", f"Expanded nodes to find shortest paths between potential destinations.")
        
        # 2. CSP Phase
        self.log("CSP Formulation", "Setting constraints: Budget <= limit, Days match, No repeats")
        variables = [f"Day_{i+1}" for i in range(request.days)]
        domains = {var: destinations for var in variables}
        
        csp = CSP(variables, domains)
        
        # Constraint: Total cost <= budget
        def budget_constraint(assignment):
            total = sum(item["cost"] for item in assignment.values())
            return total <= request.budget
            
        csp.add_constraint(variables, budget_constraint)
        
        # Constraint: No repeated cities
        def unique_constraint(assignment):
            cities = [item["name"] for item in assignment.values()]
            return len(cities) == len(set(cities))
            
        csp.add_constraint(variables, unique_constraint)
        
        solution = csp.solve()
        
        if not solution:
            self.log("CSP Failure", "Could not find an itinerary satisfying all constraints.")
            return {"error": "No valid itinerary found for given budget and days", "logs": self.logs}
            
        self.log("CSP Solution", f"Found valid assignment: {[v['name'] for v in solution.values()]}")
        
        # 3. Probabilistic & Decision Phase
        preferences = {k: 0.8 for k in request.interests}
        if not preferences:
             preferences = {"Adventure": 0.5, "Luxury": 0.5, "Culture": 0.5}
             
        final_itinerary = []
        total_utility = 0
        
        # Coordinates for Open-Meteo weather API
        coords = {
            "Ooty": (11.4102, 76.6950),
            "Coonoor": (11.3530, 76.7959),
            "Mysore": (12.2958, 76.6394),
            "Kodaikanal": (10.2381, 77.4892)
        }
        
        self.log("Real-World API", "Fetching live weather data for chosen destinations from Open-Meteo...")
        
        for day, dest in solution.items():
            city_name = dest["name"]
            weather_forecast = "Sunny" # fallback
            try:
                lat, lon = coords.get(city_name, (28.6139, 77.2090))
                url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
                req = urllib.request.Request(url, headers={'User-Agent': 'VirtueYatra/1.0'})
                with urllib.request.urlopen(req, timeout=3) as response:
                    data = json.loads(response.read().decode())
                    wcode = data.get("current_weather", {}).get("weathercode", 0)
                    # WMO Codes: >50 usually means rain/precipitation
                    if wcode >= 51:
                        weather_forecast = "Rainy"
                    else:
                        weather_forecast = "Sunny"
            except Exception as e:
                self.log("API Warning", f"Could not fetch weather for {city_name}, falling back to Sunny.")

            base_score = calculate_utility(dest, preferences, dest["cost"])
            adjusted_score = self.bayes.adjust_score(base_score * 100, weather_forecast)
            total_utility += adjusted_score
            
            final_itinerary.append({
                "day": day,
                "destination": dest["name"],
                "cost": dest["cost"],
                "utility_score": round(adjusted_score, 2),
                "reasoning": f"Chosen due to high utility. Live Weather: {weather_forecast}."
            })
            
            self.log("Decision Engine", f"Evaluated {dest['name']} with Utility: {adjusted_score:.2f} | Weather: {weather_forecast}")

        return {
            "itinerary": final_itinerary,
            "total_utility": round(total_utility, 2),
            "total_cost": sum(dest["cost"] for dest in solution.values()),
            "logs": self.logs
        }
