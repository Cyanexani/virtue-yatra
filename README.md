# VirtueYatra: AI Agent-Driven Travel Planner

VirtueYatra is a comprehensive travel planning web application powered by a sophisticated AI Agent Architecture. Unlike standard CRUD applications, VirtueYatra leverages an intelligent backend to generate optimal, constraint-satisfying, and risk-adjusted itineraries tailored to user preferences.

## 🧠 AI Agent Architecture (Syllabus Mapping)

This project strictly implements a PEAS-based Agent Architecture. The backend is designed as a pipeline of intelligent modules mapping directly to the following Course Outcomes (COs):

* **CO1: Intelligent Agent & PEAS Modeling (`backend/agents/travel_agent.py`)**
  * **Concepts Covered:** Rational Agents, PEAS (Performance measure, Environment, Actuators, Sensors) framework, Agent Types.
  * **Application:** Implements a central Goal-Based Agent Controller that coordinates the user's travel state (budget, dates, interests). It perceives the environment (user inputs, live API data) and routes it through a pipeline of sequential reasoning engines to maximize the performance measure (trip utility).

* **CO2: Uninformed & Informed Search Strategies (`backend/search/astar.py`)**
  * **Concepts Covered:** State-Space Search, Heuristic Functions, Optimal Pathfinding, A* Search.
  * **Application:** Utilizes the **A* (A-Star) Search** algorithm to navigate the combinatorial state-space of regional destinations. It calculates the most efficient routing sequences by applying cost and distance heuristics to prevent combinatorial explosion during itinerary generation.

* **CO3: Constraint Satisfaction Problems (CSP) (`backend/csp/solver.py`)**
  * **Concepts Covered:** Variables, Domains, Hard/Soft Constraints, Backtracking Search, Arc Consistency.
  * **Application:** Formulates the trip scheduling as a strict CSP. It applies Backtracking Search with constraint propagation to ensure that hard constraints (e.g., total cost ≤ budget, no repeated cities) are strictly satisfied before passing viable sub-schedules to the decision engine.

* **CO4: Utility Theory & Decision Making (`backend/decision/utility.py`)**
  * **Concepts Covered:** Multi-Attribute Utility Theory (MAUT), Rational Preferences, Decision making under certainty.
  * **Application:** Computes mathematical **Utility Scores** to quantify user satisfaction. It evaluates destinations by mapping user preferences (Adventure, Luxury, Culture) against destination attributes, subtracting weighted cost penalties to determine the mathematically optimal choice.

* **CO5: Probabilistic Reasoning & Bayesian Networks (`backend/probabilistic/bayes.py`)**
  * **Concepts Covered:** Uncertainty, Prior/Posterior Probabilities, Bayes' Theorem, Probabilistic inference.
  * **Application:** Integrates real-time external sensors (Open-Meteo Weather API) to model environment uncertainty. It applies **Bayesian Probabilistic Inference** to update the posterior viability score of a destination based on new evidence (e.g., predicting how impending rain drastically reduces the utility of an outdoor adventure spot).

* **CO6: Hybrid AI Systems & Knowledge Representation (`backend/main.py`)**
  * **Concepts Covered:** Software Architecture of AI, Integration of Symbolic and Sub-Symbolic AI, API Design.
  * **Application:** Serves as the overarching framework that connects the theoretical AI modules into a scalable Hybrid AI pipeline. It demonstrates the practical deployment of AI logic over a FastAPI REST interface, consuming Generative AI (LLM) parsing from the React frontend to complement the deterministic algorithms.

---

## 🚀 Killer Feature: Explainable AI
The frontend features an **"Explain Plan"** module. Users can click this button next to any generated itinerary day to reveal the exact reasoning, agent logs, constraints evaluated, and utility probabilities that the AI used to make that specific decision.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui
* **Backend:** Python, FastAPI, Uvicorn
* **Database / Auth:** Supabase

---

## 💻 Running the Project Locally

To run this project, you need to start both the Python backend and the React frontend simultaneously.

### 1. Start the AI Backend (Python)
Ensure you have Python installed. From the root directory:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000`*

### 2. Start the Frontend (React)
Open a new terminal window. From the root directory:
```powershell
npm install
npm run dev
```
*The web app will be available at `http://localhost:8080` (or `5173` depending on your Vite config)*
