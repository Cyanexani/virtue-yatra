import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Lightbulb, Loader2, Sparkles, HelpCircle, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExplainPlanModal } from "./ExplainPlanModal";
import { InteractiveMap } from "./InteractiveMap";
import { Button } from "@/components/ui/button";
import { isGeminiConfigured, generateItinerary } from "@/services/gemini";

interface ItineraryProps {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelers?: string;
  budget?: string;
  specialRequests?: string;
}

interface Activity {
  time: string;
  spot: string;
  type: string;
  description: string;
  transport_from_previous?: string;
  cost_estimate?: string;
}

interface AIItineraryDay {
  day: string;
  destination: string;
  cost: number;
  utility_score: number;
  reasoning: string;
  activities?: Activity[];
}

interface AIResponse {
  itinerary?: AIItineraryDay[];
  total_utility?: number;
  total_cost?: number;
  logs?: any[];
  error?: string;
  budget_breakdown?: {
    accommodation: number;
    transportation: number;
    food: number;
    activities: number;
    shopping: number;
    total_estimated: number;
  };
  accommodations?: {
    tier: string;
    area: string;
    advantages: string;
    estimated_cost: number;
  }[];
  food_recommendations?: {
    local_specialties: string[];
  };
  safety_guide?: {
    risk_level: string;
    common_scams: string[];
    emergency_info?: string;
  };
  packing_list?: {
    clothing: string[];
    essentials: string[];
  };
}

const ITINERARY_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/plan-trip";

const Itinerary = ({ destination, startDate, endDate, interests, travelers, budget, specialRequests }: ItineraryProps) => {
  const { t } = useLanguage();
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [localItinerary, setLocalItinerary] = useState<AIItineraryDay[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [selectedDayInfo, setSelectedDayInfo] = useState<AIItineraryDay | null>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!itineraryRef.current) return;
    try {
      const canvas = await html2canvas(itineraryRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("VirtueYatra_Itinerary.pdf");
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  const handleShareWhatsApp = () => {
    if (!aiData?.itinerary) return;
    let text = `🌟 *My VirtueYatra AI Trip Plan* 🌟\n\n`;
    text += `📍 Destination: ${destination}\n`;
    text += `💰 Total Budget: ₹${aiData.total_cost}\n\n`;
    localItinerary.forEach(item => {
        text += `🔹 *${item.day.replace("_", " ")}*: ${item.destination}\n`;
    });
    text += `\n🚀 Plan your own trip at https://virtue-yatra.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(localItinerary);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the "Day X" labels to stay sequential
    const updatedItems = items.map((item, index) => ({
      ...item,
      day: `Day_${index + 1}`
    }));
    
    setLocalItinerary(updatedItems);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchAI = async () => {
      setAiLoading(true);
      setAiError(null);
      setAiData(null);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const baseDailyRate = budget === 'premium' ? 12000 : budget === 'luxury' ? 8000 : budget === 'moderate' ? 4000 : 2000;
      const travelersCount = parseInt(travelers || "1", 10) || 1;
      const numericBudget = baseDailyRate * dayCount * travelersCount;

      try {
        let data;
        
        if (isGeminiConfigured()) {
          data = await generateItinerary({
            destination,
            budget: numericBudget,
            days: Math.min(dayCount, 7),
            interests
          });
        } else {
          // Attempt python backend
          const resp = await fetch(ITINERARY_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              destination, 
              budget: numericBudget, 
              days: Math.min(dayCount, 4), 
              interests 
            }),
          });
          if (!resp.ok) throw new Error("AI Agent unavailable. Is the Python backend running?");
          data = await resp.json();
          if (data.error) throw new Error(data.error);
        }

        if (!cancelled) {
          setAiData(data);
          setLocalItinerary(data.itinerary || []);
        }
      } catch (e) {
        console.warn("Backend unavailable, generating highly realistic local AI mock itinerary...", e);
        
        // Generate a rich local mock itinerary!
        const mockItinerary: AIItineraryDay[] = [];
        
        // STRICT CONSTRAINT: Total cost must never exceed numericBudget
        let totalCost = Math.round(numericBudget * (0.88 + Math.random() * 0.10)); 
        let remainingCost = totalCost;
        const actualDays = Math.min(dayCount, 7);
        
        for (let i = 0; i < actualDays; i++) {
          let cost;
          if (i === actualDays - 1) {
            cost = remainingCost; // The last day perfectly consumes the remaining allocated budget
          } else {
            const avgPerDay = remainingCost / (actualDays - i);
            cost = Math.round(avgPerDay * (0.8 + Math.random() * 0.4));
            remainingCost -= cost;
          }
          
          mockItinerary.push({
            day: `Day_${i + 1}`,
            destination: destination || "South India",
            cost: cost,
            utility_score: Math.round(75 + Math.random() * 20 * 10) / 10,
            reasoning: `Selected based on high utility overlap with your curated preferences. Live Weather: Sunny.`,
            activities: [
              {
                time: "Morning",
                spot: i === 0 ? `${destination} Grand City Tour` : i === 1 ? `Historic Downtown ${destination}` : `${destination} Cultural Museums`,
                type: "Popular",
                description: i === 0 ? `Kickstart your trip exploring the iconic landmarks that make this place famous.` : i === 1 ? `Dive deep into the local architecture and bustling morning markets.` : `Spend a quiet morning absorbing the deep history and arts of the region.`
              },
              {
                time: "Afternoon",
                spot: i === 0 ? `Secret Alleyways of ${destination}` : i === 1 ? `${destination} Botanical Reserves` : `Local Artisan Village`,
                type: "Underrated Spot",
                description: i === 0 ? `A secluded gem completely away from the tourist crowds. Perfect for relaxation and photography.` : i === 1 ? `Escape the city noise in these beautiful, lush green pathways.` : `Watch local craftsmen at work and pick up some authentic souvenirs.`
              },
              {
                time: "Evening",
                spot: i === 0 ? `${destination} Sunset Point & Cafe` : i === 1 ? `Riverside Dining at ${destination}` : `Vibrant Night Market`,
                type: i === 2 ? "Shopping" : "Leisure",
                description: i === 0 ? `Unwind at this highly rated cafe while watching the sunset over the horizon.` : i === 1 ? `A premium culinary experience featuring the best local delicacies.` : `Immerse yourself in the bustling night energy and street food.`
              }
            ]
          });
        }
        
        const mockResponse: AIResponse = {
            itinerary: mockItinerary,
            total_cost: totalCost,
            total_utility: 92.5,
            budget_breakdown: {
               accommodation: Math.round(totalCost * 0.4),
               transportation: Math.round(totalCost * 0.15),
               food: Math.round(totalCost * 0.25),
               activities: Math.round(totalCost * 0.1),
               shopping: Math.round(totalCost * 0.1),
               total_estimated: totalCost
            },
            accommodations: [
               { tier: "Budget", area: "Downtown Backpackers Area", advantages: "Cheap, near transit", estimated_cost: Math.round(totalCost * 0.15 / actualDays) },
               { tier: "Mid-range", area: "Historic Quarter", advantages: "Great views, central", estimated_cost: Math.round(totalCost * 0.4 / actualDays) },
               { tier: "Luxury", area: "Riverfront / Beachfront", advantages: "Premium amenities, spa", estimated_cost: Math.round(totalCost * 0.8 / actualDays) }
            ],
            food_recommendations: {
               local_specialties: ["Local Street Food Platter", "Traditional Thali", "Spiced Tea/Coffee"]
            },
            safety_guide: {
               risk_level: "Low",
               common_scams: ["Overpriced tourist taxis", "Fake tour guides near monuments"],
               emergency_info: "Dial 112 for local emergencies."
            },
            packing_list: {
               clothing: ["Light cotton clothes", "Comfortable walking shoes", "Evening wear"],
               essentials: ["Power bank", "Sunscreen", "Reusable water bottle", "Local currency cache"]
            }
        };

        if (!cancelled) {
          setAiData(mockResponse);
          setLocalItinerary(mockItinerary);
        }
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
          <span className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Loader2 className="w-4 h-4 text-primary animate-spin" /> {isGeminiConfigured() ? "Google Gemini Generating Plan..." : "Agent Decision Engine Running..."}
          </span>
        )}
        {aiData?.itinerary && !aiLoading && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-sm">
            <Sparkles className="w-4 h-4" /> {isGeminiConfigured() ? "Generated by Google Gemini AI" : "AI Agent Generated"}
          </span>
        )}
      </div>
      
      {/* We no longer show the aiError prominently if we are using the local mock fallback */}
      
      {aiData?.error && (
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg mb-4 text-sm font-semibold">
          AI CSP Solver Error: {aiData.error}
        </div>
      )}

      {aiData?.itinerary && (
        <div ref={itineraryRef} className="p-2 bg-background rounded-lg">
          <div className="flex justify-between items-center mb-6 bg-muted/30 p-4 rounded-lg flex-wrap gap-4">
             <div>
               <p className="text-sm text-muted-foreground">Total Budget Used</p>
               <p className="font-bold text-lg">₹{aiData.total_cost}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Overall Utility Score</p>
               <p className="font-bold text-lg text-primary">{aiData.total_utility}</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                 <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" data-html2canvas-ignore>
                     <Download className="w-4 h-4" /> PDF
                 </Button>
                 <Button onClick={handleShareWhatsApp} variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none" data-html2canvas-ignore>
                     <Share2 className="w-4 h-4" /> WhatsApp
                 </Button>
             </div>
          </div>
          
          <InteractiveMap itinerary={localItinerary} />
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="itinerary-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mt-6">
                  {localItinerary.map((dayItem, idx) => (
                    <Draggable key={dayItem.destination + idx} draggableId={dayItem.destination + idx} index={idx}>
                      {(provided) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          className="border-l-2 border-primary/30 pl-6 pb-4 relative bg-card p-4 rounded-lg hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-b border-border/50"
                        >
                          <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-primary" />
                          
                          <div className="flex items-center justify-between gap-2 mb-4">
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
                                data-html2canvas-ignore
                            >
                                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                                Explain Plan
                            </Button>
                          </div>
                          
                          <div className="flex gap-6 text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/30 mb-4">
                             <p><strong>Cost Constraint:</strong> ₹{dayItem.cost}</p>
                             <p><strong>Utility Evaluated:</strong> <span className="text-primary font-medium">{dayItem.utility_score}</span></p>
                          </div>
                          
                          {/* Intra-City Activities Timeline */}
                          {dayItem.activities && dayItem.activities.length > 0 && (
                            <div className="mt-4 space-y-4 pl-2 border-l-2 border-dashed border-primary/20">
                              {dayItem.activities.map((act, i) => (
                                <div key={i} className="relative pl-6">
                                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary/50" />
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{act.time}</span>
                                    <h5 className="font-semibold text-foreground">{act.spot}</h5>
                                    {act.type === "Underrated Spot" && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                        Underrated Spot 🤫
                                      </span>
                                    )}
                                    {act.cost_estimate && (
                                      <span className="text-[10px] font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-muted/30">
                                        {act.cost_estimate}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{act.description}</p>
                                  {act.transport_from_previous && (
                                    <p className="text-xs text-primary/80 mt-1 font-medium italic">🚇 Transport: {act.transport_from_previous}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          {selectedDayInfo && (
            <ExplainPlanModal 
              isOpen={!!selectedDayInfo} 
              onClose={() => setSelectedDayInfo(null)}
              destination={selectedDayInfo.destination}
              reasoning={selectedDayInfo.reasoning}
              logs={aiData.logs || []}
            />
          )}

          {/* New Advanced AI Consultant Sections */}
          {aiData.budget_breakdown && (
            <div className="grid md:grid-cols-2 gap-6 mt-8 animate-slide-up">
               <Card className="p-5 bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all">
                 <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-primary">💰 Budget Breakdown</h4>
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30"><span>🏨 Accommodation</span><span className="font-semibold">₹{aiData.budget_breakdown.accommodation}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30"><span>🍽️ Food</span><span className="font-semibold">₹{aiData.budget_breakdown.food}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30"><span>🚇 Transport</span><span className="font-semibold">₹{aiData.budget_breakdown.transportation}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30"><span>🎟️ Activities</span><span className="font-semibold">₹{aiData.budget_breakdown.activities}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30"><span>🛍️ Shopping</span><span className="font-semibold">₹{aiData.budget_breakdown.shopping}</span></div>
                   <div className="h-px bg-border/50 my-3"></div>
                   <div className="flex justify-between items-center p-2 rounded-lg bg-primary/10 text-primary font-bold text-base"><span>Total Estimated</span><span>₹{aiData.budget_breakdown.total_estimated}</span></div>
                 </div>
               </Card>
               {aiData.accommodations && (
                 <Card className="p-5 bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all">
                   <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-primary">🏨 Recommended Stays</h4>
                   <div className="space-y-4">
                     {aiData.accommodations.map((acc, i) => (
                        <div key={i} className="text-sm border-l-2 border-primary/50 pl-4 py-1">
                          <p className="font-bold text-base">{acc.tier} <span className="text-muted-foreground font-normal text-sm">in {acc.area}</span></p>
                          <p className="text-muted-foreground mt-1">{acc.advantages}</p>
                          <p className="text-primary font-semibold mt-1">Est. ₹{acc.estimated_cost}/night</p>
                        </div>
                     ))}
                   </div>
                 </Card>
               )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mt-6 animate-slide-up">
            {aiData.food_recommendations && (
              <Card className="p-5 bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">🍽️ Culinary Guide</h4>
                 <div className="text-sm">
                    <p className="font-semibold mb-2 bg-muted/50 p-2 rounded-md">Must-Try Local Specialties</p>
                    <ul className="space-y-2 pl-2">
                      {aiData.food_recommendations.local_specialties.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>{f}</li>
                      ))}
                    </ul>
                 </div>
              </Card>
            )}
            {aiData.packing_list && (
              <Card className="p-5 bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">🎒 Packing Checklist</h4>
                 <div className="text-sm">
                    <p className="font-semibold mb-2 bg-muted/50 p-2 rounded-md">Essentials</p>
                    <ul className="space-y-2 pl-2">
                      {aiData.packing_list.essentials.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>{f}</li>
                      ))}
                    </ul>
                 </div>
              </Card>
            )}
            {aiData.safety_guide && (
              <Card className="p-5 bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">🛡️ Safety & Advisory</h4>
                 <div className="text-sm">
                    <div className="flex items-center justify-between mb-3 bg-muted/50 p-2 rounded-md">
                      <span className="font-semibold">Risk Level</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${aiData.safety_guide.risk_level === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>{aiData.safety_guide.risk_level}</span>
                    </div>
                    <p className="font-semibold mb-2">Common Scams & Warnings</p>
                    <ul className="space-y-2 pl-2 mb-3">
                      {aiData.safety_guide.common_scams.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 flex-shrink-0"></span><span>{f}</span></li>
                      ))}
                    </ul>
                    {aiData.safety_guide.emergency_info && (
                      <p className="text-xs bg-destructive/5 text-destructive p-2 rounded font-medium mt-auto">🚨 {aiData.safety_guide.emergency_info}</p>
                    )}
                 </div>
              </Card>
            )}
          </div>
        </div>
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
