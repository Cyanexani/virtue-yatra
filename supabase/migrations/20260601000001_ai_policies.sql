-- Secure RLS policies for AI schema tables scoped to the authenticated user

-- agent_logs
CREATE POLICY "Users can view own logs"
  ON public.agent_logs FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

-- trip_constraints
CREATE POLICY "Users can view own trip constraints"
  ON public.trip_constraints FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trip constraints"
  ON public.trip_constraints FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

-- trip_preferences  
CREATE POLICY "Users can view own trip preferences"
  ON public.trip_preferences FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trip preferences"
  ON public.trip_preferences FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

-- search_nodes
CREATE POLICY "Users can view own search nodes"
  ON public.search_nodes FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own search nodes"
  ON public.search_nodes FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

-- probability_models (shared, read-only for authenticated users)
CREATE POLICY "Users can view probability models"
  ON public.probability_models FOR SELECT
  USING (auth.role() = 'authenticated');
