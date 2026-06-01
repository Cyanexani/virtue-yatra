# VirtueYatra: AI Agent-Driven Travel Planner

VirtueYatra is a comprehensive travel planning web application powered by a sophisticated AI Agent Architecture. Unlike standard CRUD applications, VirtueYatra leverages an intelligent backend to generate optimal, constraint-satisfying, and risk-adjusted itineraries tailored to user preferences.

## 🧠 AI Agent Architecture (Syllabus Mapping)

This project strictly implements a PEAS-based Agent Architecture. The backend is designed as a pipeline of intelligent modules mapping directly to the following Course Outcomes (COs):

* **CO1: Agent Model (`backend/agents/travel_agent.py`)**
  * Implements a central Agent Controller that coordinates the user's travel state (budget, dates, interests) and routes it through the reasoning engines.
* **CO2: Search Algorithms (`backend/search/astar.py`)**
  * Utilizes the **A* (A-Star) Search** algorithm to discover the most efficient routing sequences based on heuristics like cost and time.
* **CO3: Constraint Satisfaction Problem (`backend/csp/solver.py`)**
  * Solves scheduling and budget constraints via **Backtracking CSP**, ensuring no locations are repeated and the total budget is respected.
* **CO4: Decision Engine (`backend/decision/utility.py`)**
  * Computes mathematical **Utility Scores** to maximize the user's weighted interests (Adventure, Luxury, Culture) minus cost penalties.
* **CO5: Bayesian Network (`backend/probabilistic/bayes.py`)**
  * Applies a **Bayesian Probabilistic Model** to evaluate real-world uncertainties (like weather causing unexpected crowds) and adjusts destination viability dynamically.
* **CO6: Hybrid AI System (`backend/main.py`)**
  * Connects the React Frontend to the FastAPI AI pipeline, demonstrating a robust, hybrid intelligence system over a REST API.

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
