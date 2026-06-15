import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, startDate, endDate, interests, travelers, budget, specialRequests } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.max(1, Math.min(7, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1));

    const baseDailyRate = budget === "premium" ? 12000 : budget === "luxury" ? 8000 : budget === "moderate" ? 4000 : 2000;
    const travelersCount = parseInt(travelers || "1", 10) || 1;
    const numericBudget = baseDailyRate * dayCount * travelersCount;

    const systemPrompt = `You are Virtue Yatra AI Planner, an expert travel strategist with deep knowledge of Indian and international tourism, transportation, accommodation, budgeting, local culture, weather, safety, events, food, and route optimization.

Think like:
1. Travel Consultant
2. Local Guide
3. Budget Planner
4. Logistics Coordinator
5. Safety Advisor
6. Experience Designer

Rules:
- Every activity MUST mention SPECIFIC named places, landmarks, restaurants, markets, or experiences in or near the destination — never generic phrases like "explore the city".
- Group days geographically. Never create impossible schedules.
- Ensure the sum of all "cost" fields plus the budget breakdown total does NOT exceed the Total Budget Constraint.
- Tailor activities and recommendations to the user's interests, traveler count, budget tier, and special requests.
- Return data strictly conforming to the provided JSON schema.`;

    const userPrompt = `Plan a ${dayCount}-day trip to ${destination}.
Travel dates: ${startDate} to ${endDate}
Travelers: ${travelersCount}
Budget tier: ${budget || "moderate"}
Total Budget Constraint: ₹${numericBudget}
Interests: ${interests?.length ? interests.join(", ") : "general sightseeing"}
Special requests: ${specialRequests || "none"}

Return a complete travel plan as JSON, with real, specific place names for ${destination}.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        itinerary: {
          type: "ARRAY",
          description: `Exactly ${dayCount} day objects.`,
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "STRING", description: "Format: Day_X" },
              destination: { type: "STRING", description: "The main city/area for the day." },
              cost: { type: "NUMBER", description: "Estimated total cost for the day in INR." },
              utility_score: { type: "NUMBER", description: "Score 1-100 based on matching the user's interests." },
              reasoning: { type: "STRING", description: "Brief explanation of why this day is planned this way, including weather assumption." },
              activities: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    time: { type: "STRING", description: "Morning, Afternoon, Evening, or Night" },
                    spot: { type: "STRING", description: "Specific named place/activity." },
                    type: { type: "STRING", description: "E.g. Popular, Underrated Spot, Leisure, Adventure, Shopping" },
                    description: { type: "STRING", description: "1-2 sentence description with a practical tip." },
                    transport_from_previous: { type: "STRING", description: "Transport advice from the previous spot." },
                    cost_estimate: { type: "STRING", description: "Cost breakdown for this activity." }
                  },
                  required: ["time", "spot", "type", "description"]
                }
              }
            },
            required: ["day", "destination", "cost", "utility_score", "reasoning", "activities"]
          }
        },
        budget_breakdown: {
          type: "OBJECT",
          properties: {
            accommodation: { type: "NUMBER" },
            transportation: { type: "NUMBER" },
            food: { type: "NUMBER" },
            activities: { type: "NUMBER" },
            shopping: { type: "NUMBER" },
            total_estimated: { type: "NUMBER", description: `Should be close to but not exceed ${numericBudget}.` }
          },
          required: ["accommodation", "transportation", "food", "activities", "shopping", "total_estimated"]
        },
        accommodations: {
          type: "ARRAY",
          description: "3 accommodation tiers for this destination.",
          items: {
            type: "OBJECT",
            properties: {
              tier: { type: "STRING", description: "Budget, Mid-range, or Luxury" },
              area: { type: "STRING", description: "Specific neighborhood/area name." },
              advantages: { type: "STRING" },
              estimated_cost: { type: "NUMBER", description: "Cost per night in INR." }
            },
            required: ["tier", "area", "advantages", "estimated_cost"]
          }
        },
        food_recommendations: {
          type: "OBJECT",
          properties: {
            local_specialties: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Specific named local dishes or restaurants."
            }
          },
          required: ["local_specialties"]
        },
        safety_guide: {
          type: "OBJECT",
          properties: {
            risk_level: { type: "STRING", description: "Low, Medium, or High" },
            common_scams: { type: "ARRAY", items: { type: "STRING" } },
            emergency_info: { type: "STRING", description: "Local emergency numbers and key advice." }
          },
          required: ["risk_level", "common_scams", "emergency_info"]
        },
        packing_list: {
          type: "OBJECT",
          properties: {
            clothing: { type: "ARRAY", items: { type: "STRING" } },
            essentials: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["clothing", "essentials"]
        }
      },
      required: ["itinerary", "budget_breakdown", "accommodations", "food_recommendations", "safety_guide", "packing_list"]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota exceeded. Please check your Gemini API billing/quota." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 403 || response.status === 401) {
        return new Response(JSON.stringify({ error: "Gemini API key is invalid or unauthorized." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No itinerary returned");
    const parsed = JSON.parse(text);

    // Defensive: clamp activity types to known tags so the UI badges don't break
    const knownTypes = ["Popular", "Underrated Spot", "Leisure", "Adventure", "Shopping", "Relaxation", "Photography", "Party"];
    if (Array.isArray(parsed.itinerary)) {
      for (const day of parsed.itinerary) {
        if (Array.isArray(day.activities)) {
          for (const act of day.activities) {
            if (act.type && !knownTypes.includes(act.type)) {
              act.type = "Leisure";
            }
          }
        }
      }
    }

    const itinerary = parsed.itinerary || [];
    const total_cost = parsed.budget_breakdown?.total_estimated
      ?? itinerary.reduce((sum: number, d: { cost?: number }) => sum + (d.cost || 0), 0);
    const total_utility = itinerary.length
      ? Math.round(itinerary.reduce((sum: number, d: { utility_score?: number }) => sum + (d.utility_score || 0), 0) / itinerary.length)
      : 0;

    const result = {
      ...parsed,
      total_cost,
      total_utility,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("itinerary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
