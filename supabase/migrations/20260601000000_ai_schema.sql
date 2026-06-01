-- Create tables for AI Agent reasoning and data tracking
CREATE TABLE public.trip_constraints (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE PRIMARY KEY,
  budget_limit NUMERIC NOT NULL,
  max_travel_hours INTEGER,
  preferred_transport TEXT
);

CREATE TABLE public.trip_preferences (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE PRIMARY KEY,
  adventure_weight NUMERIC NOT NULL DEFAULT 0.5,
  luxury_weight NUMERIC NOT NULL DEFAULT 0.5,
  culture_weight NUMERIC NOT NULL DEFAULT 0.5
);

CREATE TABLE public.agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  step_number SERIAL NOT NULL,
  step_name TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.search_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  cost NUMERIC NOT NULL,
  heuristic NUMERIC NOT NULL
);

CREATE TABLE public.probability_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT UNIQUE NOT NULL,
  prior_distribution JSONB NOT NULL,
  conditional_tables JSONB NOT NULL
);

ALTER TABLE public.trip_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probability_models ENABLE ROW LEVEL SECURITY;
