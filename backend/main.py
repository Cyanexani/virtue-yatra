from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from agents.travel_agent import TravelAgent, TravelState
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="VirtueYatra AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")

class TripRequest(BaseModel):
    destination: str
    budget: float
    days: int
    interests: List[str]

@app.post("/plan-trip")
async def plan_trip(req: TripRequest):
    agent = TravelAgent()
    state = TravelState(
        city=req.destination,
        budget=req.budget,
        days=req.days,
        interests=req.interests
    )
    
    result = agent.generate_trip(state)
    
    if supabase and "itinerary" in result:
        try:
            # Here we would log the generated trip to Supabase
            pass
        except Exception as e:
            print(f"Supabase logging failed: {e}")
            
    return result
