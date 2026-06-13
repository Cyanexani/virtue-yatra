import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Google Generative AI client
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const isGeminiConfigured = () => !!genAI;

/**
 * Parses user prompt to extract structured preferences using Gemini.
 */
export const parseUserPrompt = async (prompt: string) => {
  if (!genAI) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          destination: { type: SchemaType.STRING, description: "The destination city or region requested. Default to 'South India' if vague." },
          budget: { type: SchemaType.STRING, enum: ["budget", "moderate", "luxury", "premium"] },
          days: { type: SchemaType.INTEGER, description: "The number of days for the trip. Convert weeks/months to days." },
          interests: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
              enum: ["Adventure", "Beach", "Culture", "Wildlife", "Photography", "Food", "Hiking", "Relaxation", "Shopping", "History"]
            }
          }
        },
        required: ["destination", "budget", "days", "interests"]
      }
    }
  });

  const result = await model.generateContent(`Extract the travel preferences from this user input: "${prompt}"`);
  return JSON.parse(result.response.text());
};

/**
 * Generates a detailed day-by-day itinerary with advanced consultant data.
 */
export const generateItinerary = async (preferences: { destination: string; days: number; budget: number; interests: string[] }) => {
  if (!genAI) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          itinerary: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                day: { type: SchemaType.STRING, description: "Format: Day_X" },
                destination: { type: SchemaType.STRING, description: "The main city/region for the day." },
                cost: { type: SchemaType.INTEGER, description: "Estimated cost constraint for the day in INR." },
                utility_score: { type: SchemaType.NUMBER, description: "Utility score from 1 to 100 based on matching interests." },
                reasoning: { type: SchemaType.STRING, description: "Brief explanation of why this day is planned this way." },
                activities: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      time: { type: SchemaType.STRING, description: "Morning, Afternoon, Evening, or Night" },
                      spot: { type: SchemaType.STRING, description: "Name of the specific place/activity." },
                      type: { type: SchemaType.STRING, description: "E.g., 'Popular', 'Underrated Spot', 'Leisure', 'Adventure'" },
                      description: { type: SchemaType.STRING, description: "Short, engaging description of the activity." },
                      transport_from_previous: { type: SchemaType.STRING, description: "Transport optimization from previous spot" },
                      cost_estimate: { type: SchemaType.STRING, description: "Activity/Entry cost breakdown" }
                    },
                    required: ["time", "spot", "type", "description"]
                  }
                }
              },
              required: ["day", "destination", "cost", "utility_score", "reasoning", "activities"]
            }
          },
          budget_breakdown: {
            type: SchemaType.OBJECT,
            properties: {
              accommodation: { type: SchemaType.INTEGER },
              transportation: { type: SchemaType.INTEGER },
              food: { type: SchemaType.INTEGER },
              activities: { type: SchemaType.INTEGER },
              shopping: { type: SchemaType.INTEGER },
              total_estimated: { type: SchemaType.INTEGER }
            },
            required: ["accommodation", "transportation", "food", "activities", "shopping", "total_estimated"]
          },
          accommodations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                tier: { type: SchemaType.STRING, description: "Budget, Mid-range, or Luxury" },
                area: { type: SchemaType.STRING },
                advantages: { type: SchemaType.STRING },
                estimated_cost: { type: SchemaType.INTEGER, description: "Cost per night" }
              },
              required: ["tier", "area", "advantages", "estimated_cost"]
            }
          },
          food_recommendations: {
            type: SchemaType.OBJECT,
            properties: {
              local_specialties: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["local_specialties"]
          },
          safety_guide: {
            type: SchemaType.OBJECT,
            properties: {
              risk_level: { type: SchemaType.STRING, description: "Low, Medium, or High" },
              common_scams: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              emergency_info: { type: SchemaType.STRING }
            },
            required: ["risk_level", "common_scams"]
          },
          packing_list: {
            type: SchemaType.OBJECT,
            properties: {
              clothing: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              essentials: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["clothing", "essentials"]
          }
        },
        required: ["itinerary", "budget_breakdown", "accommodations", "food_recommendations", "safety_guide", "packing_list"]
      }
    }
  });

  const prompt = `
SYSTEM ROLE
You are Virtue Yatra AI Planner, an expert travel strategist with knowledge of tourism, transportation, accommodation, budgeting, local culture, weather, safety, events, food, and route optimization.
Your task is NOT to simply generate an itinerary. Your task is to create a complete travel plan that is realistic, optimized, personalized, and actionable.

You must think like:
1. Travel Consultant
2. Local Guide
3. Budget Planner
4. Logistics Coordinator
5. Safety Advisor
6. Experience Designer

USER INPUT
Destination: ${preferences.destination}
Travel Dates/Duration: ${preferences.days} days
Total Budget Constraint: ₹${preferences.budget}
Interests: ${preferences.interests.join(", ")}

PLANNING OBJECTIVES
Analyze: Season, Weather, Crowds, Safety, Transport.
Optimize for: Minimum travel time, Maximum experience value, Budget efficiency, Realistic pacing.
Never create impossible schedules. Group geographically.
Ensure Total Estimated Cost does NOT exceed the Budget Constraint!
Return data strictly conforming to the requested JSON schema.
  `;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());
  
  return {
    ...data,
    total_cost: data.budget_breakdown.total_estimated,
    total_utility: Math.round(data.itinerary.reduce((sum: number, day: any) => sum + day.utility_score, 0) / data.itinerary.length)
  };
};
