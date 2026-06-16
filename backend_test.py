import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from agents.travel_agent import TravelAgent, TravelState
from pprint import pprint

agent = TravelAgent()
state = TravelState(city="South India", budget=15000, days=4, interests=["Adventure", "Luxury"])

result = agent.generate_trip(state)
for log in result.get("logs", []):
    print(f"[{log['step']}] {log['reasoning']}")

print("\nResult Itinerary:")
if "itinerary" in result:
    for day in result["itinerary"]:
        print(f"{day['day']}: {day['destination']} (Cost: {day['cost']}, Utility: {day['utility_score']})")
else:
    print(result)
