# VirtueYatra AI Agent Backend

This backend implements the AI concepts specified in the syllabus, transforming the application into a full-fledged intelligent system. 

## Syllabus Mapping (Course Outcomes)

The architecture is divided into the following modules to directly address the course outcomes:

* **CO1: Agent Model**
  * **File:** `agents/travel_agent.py`
  * **Implementation:** Implements a PEAS-style Travel Agent that acts as the central controller, receiving user state and orchestrating the reasoning engines.

* **CO2: Search Algorithms**
  * **File:** `search/astar.py`
  * **Implementation:** Uses the A* (A-Star) search algorithm to navigate through potential travel destinations using a custom heuristic (optimizing for time and cost constraints).

* **CO3: Constraint Satisfaction Problem (CSP)**
  * **File:** `csp/solver.py`
  * **Implementation:** A backtracking CSP solver that ensures generated itineraries do not repeat cities and strictly adhere to the user's budget and schedule constraints.

* **CO4: Decision Engine**
  * **File:** `decision/utility.py`
  * **Implementation:** Calculates maximum utility for each destination by weighing user preferences (Adventure, Luxury, Culture) against cost penalties.

* **CO5: Bayesian Network**
  * **File:** `probabilistic/bayes.py`
  * **Implementation:** Evaluates risk and uncertainty using a probabilistic model (e.g., determining the probability of high crowds based on weather forecasts) and adjusts the destination's utility score accordingly.

* **CO6: Hybrid AI System**
  * **File:** `main.py` & `agents/travel_agent.py`
  * **Implementation:** The overarching architecture connects all the modules (Search -> CSP -> Bayes -> Decision) into one cohesive, hybrid AI pipeline accessible via the `/plan-trip` FastAPI endpoint.
