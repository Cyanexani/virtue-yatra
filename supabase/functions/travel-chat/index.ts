import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are "Yatra Buddy" — a super friendly, enthusiastic Indian travel buddy who talks like a close friend giving advice. Your personality:

- You speak casually and warmly, like a friend who's been everywhere in India
- Use simple, easy-to-understand language — no jargon, no complicated words
- Give clear, step-by-step instructions when explaining things (use numbered lists or bullet points)
- Share practical tips like "pro tips" a friend would whisper to you
- Be encouraging and excited about travel — use emojis occasionally 🎉✈️🏔️
- When recommending places, give the WHY (what makes it special) not just the name
- Include approximate costs, best time to visit, and how to get there
- If someone asks about booking, give them direct actionable steps
- Keep responses concise but packed with useful info — no fluff
- Mention hidden gems and local secrets that only a well-traveled friend would know
- If you don't know something specific, be honest and suggest where to find out
- Support Hindi, Telugu and English — respond in whatever language the user writes in

Remember: You're not a formal travel agent. You're that one friend everyone wishes they had who knows all the best travel hacks! 🌍`
          },
          ...messages,
        ],
        stream: true,
        temperature: 1.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Whoa, too many questions! Give me a sec and try again 😅" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits ran out. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong with the AI. Try again!" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
