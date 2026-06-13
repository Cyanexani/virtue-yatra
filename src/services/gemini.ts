import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

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
 * Generates a detailed day-by-day itinerary with intra-city activities using Gemini.
 */
export const generateItinerary = async (preferences: { destination: string; days: number; budget: number; interests: string[] }) => {
  if (!genAI) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        description: "List of daily itineraries.",
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
                  time: { type: SchemaType.STRING, description: "Morning, Afternoon, or Evening" },
                  spot: { type: SchemaType.STRING, description: "Name of the specific place/activity." },
                  type: { type: SchemaType.STRING, description: "E.g., 'Popular', 'Underrated Spot', 'Leisure', 'Adventure'" },
                  description: { type: SchemaType.STRING, description: "Short, engaging description of the activity." }
                },
                required: ["time", "spot", "type", "description"]
              }
            }
          },
          required: ["day", "destination", "cost", "utility_score", "reasoning", "activities"]
        }
      }
    }
  });

  const prompt = `
    Create a highly detailed, immersive travel itinerary for ${preferences.destination}.
    Total duration: ${preferences.days} days.
    Total budget constraint: ₹${preferences.budget}.
    User Interests: ${preferences.interests.join(", ")}.
    
    Make sure to include a mix of popular attractions and 'Underrated Spot' locations!
    Provide exactly ${preferences.days} days.
  `;

  const result = await model.generateContent(prompt);
  const itinerary = JSON.parse(result.response.text());
  
  return {
    itinerary,
    total_cost: itinerary.reduce((sum: number, day: any) => sum + day.cost, 0),
    total_utility: Math.round(itinerary.reduce((sum: number, day: any) => sum + day.utility_score, 0) / itinerary.length)
  };
};
