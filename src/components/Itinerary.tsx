import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Lightbulb, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExplainPlanModal } from "./ExplainPlanModal";
import { Button } from "@/components/ui/button";

interface ItineraryProps {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelers?: string;
  budget?: string;
  specialRequests?: string;
}

interface AIItineraryDay {
  day: string;
  destination: string;
  cost: number;
  utility_score: number;
  reasoning: string;
}

interface AIResponse {
  itinerary?: AIItineraryDay[];
  total_utility?: number;
  total_cost?: number;
  logs?: any[];
  error?: string;
}

const ITINERARY_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/plan-trip";

const Itinerary = ({ destination, startDate, endDate, interests, travelers, budget, specialRequests }: ItineraryProps) => {
  const { t } = useLanguage();
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [selectedDayInfo, setSelectedDayInfo] = useState<AIItineraryDay | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAI = async () => {
      setAiLoading(true);
      setAiError(null);
      setAiData(null);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const numericBudget = budget === 'premium' ? 30000 : budget === 'luxury' ? 20000 : budget === 'moderate' ? 15000 : 10000;

      try {
        const resp = await fetch(ITINERARY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            destination, 
            budget: numericBudget, 
            // We cap at 4 days since the CSP constraints only have 4 mock cities with unique constraints.
            days: Math.min(dayCount, 4), 
            interests 
          }),
        });
        if (!resp.ok) throw new Error("AI Agent unavailable. Is the Python backend running?");
        const data = await resp.json();
        if (!cancelled) setAiData(data);
      } catch (e) {
        if (!cancelled) setAiError(e instanceof Error ? e.message : "Failed to load AI itinerary");
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };
    if (destination && startDate && endDate) fetchAI();
    return () => { cancelled = true; };
  }, [destination, startDate, endDate, JSON.stringify(interests), travelers, budget, specialRequests]);

  return (
    <Card className="p-6 mt-8 border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold">{t('itinerary.title') || "Agentic AI Trip Plan"}</h3>
        </div>
        {aiLoading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Agent Decision Engine Running...
          </span>
        )}
        {aiData?.itinerary && !aiLoading && (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" /> AI Agent Generated
          </span>
        )}
      </div>
      
      {aiError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4 text-sm">
          {aiError}
        </div>
      )}
      
      {aiData?.error && (
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg mb-4 text-sm font-semibold">
          AI CSP Solver Error: {aiData.error}
        </div>
      )}

      {aiData?.itinerary && (
        <>
          <div className="flex justify-between items-center mb-6 bg-muted/30 p-4 rounded-lg">
             <div>
               <p className="text-sm text-muted-foreground">Total Budget Used</p>
               <p className="font-bold text-lg">₹{aiData.total_cost}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Overall Utility Score</p>
               <p className="font-bold text-lg text-primary">{aiData.total_utility}</p>
             </div>
          </div>
          
          <div className="space-y-6">
            {aiData.itinerary.map((dayItem, idx) => {
              return (
                <div key={idx} className="border-l-2 border-primary/30 pl-6 pb-4 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                  
                  <div className="flex items-center justify-between gap-2 mb-4 pt-1">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {dayItem.day.replace("_", " ")}
                        </span>
                        <h4 className="font-bold text-xl">{dayItem.destination}</h4>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 shadow-sm hover:border-primary/50"
                        onClick={() => setSelectedDayInfo(dayItem)}
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        Explain Plan
                    </Button>
                  </div>
                  
                  <div className="flex gap-6 text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/30">
                     <p><strong>Cost Constraint:</strong> ₹{dayItem.cost}</p>
                     <p><strong>Utility Evaluated:</strong> <span className="text-primary font-medium">{dayItem.utility_score}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedDayInfo && (
            <ExplainPlanModal 
              isOpen={!!selectedDayInfo} 
              onClose={() => setSelectedDayInfo(null)}
              destination={selectedDayInfo.destination}
              reasoning={selectedDayInfo.reasoning}
              logs={aiData.logs || []}
            />
          )}
        </>
      )}

      {/* Travel Tips */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-travel-ocean/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">{t('itinerary.tips') || "Travel Tips"}</h4>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Check the weather prediction probabilities generated by the agent.
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Utility is maximized based on your preferences.
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default Itinerary;
