import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, startDate, endDate, interests, travelers, budget, specialRequests } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.max(1, Math.min(7, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1));

    const systemPrompt = `You are an expert Indian travel planner. Generate a highly specific, day-by-day itinerary for the user's trip. For each day return THREE activities (morning, afternoon, evening). Each activity MUST mention SPECIFIC named places, landmarks, restaurants, markets, or experiences in or near the destination — never generic phrases like "explore the city". Tailor activities to the user's selected interests, traveler count, budget, and special requests. Keep each activity to 1-2 sentences with the place name + what makes it special + a quick practical tip when useful.`;

    const userPrompt = `Plan a ${dayCount}-day trip to ${destination}.
Travel dates: ${startDate} to ${endDate}
Travelers: ${travelers}
Budget: ${budget || "not specified"}
Interests: ${interests?.length ? interests.join(", ") : "general sightseeing"}
Special requests: ${specialRequests || "none"}

Return a JSON itinerary using the provided tool. Include real, specific place names for ${destination}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_itinerary",
              description: "Return a full rich itinerary package including budget, accommodations, food recommendations, safety guide, and packing list.",
              parameters: {
                type: "object",
                properties: {
                  itinerary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string", description: "e.g., 'Day_1'" },
                        destination: { type: "string" },
                        cost: { type: "number", description: "Estimated cost for this day" },
                        utility_score: { type: "number", description: "Score out of 100 based on user preferences" },
                        reasoning: { type: "string", description: "Why this day plan fits the user" },
                        activities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              time: { type: "string" },
                              spot: { type: "string" },
                              type: { type: "string" },
                              description: { type: "string" },
                              transport_from_previous: { type: "string" },
                              cost_estimate: { type: "string" }
                            },
                            required: ["time", "spot", "type", "description"]
                          }
                        }
                      },
                      required: ["day", "destination", "cost", "utility_score", "reasoning", "activities"]
                    }
                  },
                  budget_breakdown: {
                    type: "object",
                    properties: {
                      accommodation: { type: "number" },
                      transportation: { type: "number" },
                      food: { type: "number" },
                      activities: { type: "number" },
                      shopping: { type: "number" },
                      total_estimated: { type: "number" }
                    },
                    required: ["accommodation", "transportation", "food", "activities", "shopping", "total_estimated"]
                  },
                  accommodations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tier: { type: "string" },
                        area: { type: "string" },
                        advantages: { type: "string" },
                        estimated_cost: { type: "number" }
                      },
                      required: ["tier", "area", "advantages", "estimated_cost"]
                    }
                  },
                  food_recommendations: {
                    type: "object",
                    properties: {
                      local_specialties: { type: "array", items: { type: "string" } }
                    },
                    required: ["local_specialties"]
                  },
                  safety_guide: {
                    type: "object",
                    properties: {
                      risk_level: { type: "string" },
                      common_scams: { type: "array", items: { type: "string" } },
                      emergency_info: { type: "string" }
                    },
                    required: ["risk_level", "common_scams", "emergency_info"]
                  },
                  packing_list: {
                    type: "object",
                    properties: {
                      clothing: { type: "array", items: { type: "string" } },
                      essentials: { type: "array", items: { type: "string" } }
                    },
                    required: ["clothing", "essentials"]
                  }
                },
                required: ["itinerary", "budget_breakdown", "accommodations", "food_recommendations", "safety_guide", "packing_list"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_itinerary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits ran out. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("No itinerary returned");
    const parsed = JSON.parse(args);

    // Ensure total cost and utility score are calculated
    parsed.total_cost = parsed.itinerary.reduce((sum: number, day: any) => sum + (day.cost || 0), 0);
    const avgUtility = parsed.itinerary.reduce((sum: number, day: any) => sum + (day.utility_score || 0), 0) / (parsed.itinerary.length || 1);
    parsed.total_utility = parseFloat(avgUtility.toFixed(1));

    return new Response(JSON.stringify(parsed), {
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
